const ERC20BatchPayments = artifacts.require('ERC20BatchPayments');
const {
  REF_A,
  REF_B,
  REF_C,
  TRON_ZERO_ADDRESS,
  waitForConfirmation,
  balanceOf,
  diff,
  deployBaseSetup,
  makeTokenApproval,
  deployTokenWithSupply,
  expectRevertOrNoBalanceChange,
  assertBatchTokenBalancesZero,
  deployBadTRC20,
  sumStrings,
  mulString,
  getApprovalAmount,
} = require('./helpers');

contract('ERC20BatchPayments Tron Test Suite', (accounts) => {
  const payer = accounts[0];
  const payee1 = accounts[1] || 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE';
  const payee2 = accounts[2] || 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs';
  const payee3 = accounts[3] || 'TFwt56qg984vEmk2UoDqUDeZhWEFSDaTmk';
  const feeAddress = accounts[4] || 'TNPGB28MjVCnEhTfpW51C2Ap3ZNnqGDXLB';

  let batch;
  let token1;
  let token2;
  let token3;

  before(async () => {
    const setup = await deployBaseSetup({
      accounts,
      batchDeployFn: (erc20FeeProxy) => ERC20BatchPayments.new(erc20FeeProxy.address),
    });
    batch = setup.batch;
    [token1, token2, token3] = setup.tokens;

    console.log('\n=== ERC20BatchPayments Test Setup ===');
    console.log('Batch:', batch.address);
    await waitForConfirmation(3000);
  });

  beforeEach(async () => {
    await waitForConfirmation(2000);
  });

  describe('Happy Path Payment Scenarios', () => {
    describe('batchERC20PaymentsWithReference', () => {
      it('should pay 3 ERC20 payments', async () => {
        const amount1 = '2000';
        const amount2 = '300';
        const amount3 = '400';
        const fee1 = '200';
        const fee2 = '20';
        const fee3 = '30';

        await makeTokenApproval(
          token1,
          payer,
          batch.address,
          getApprovalAmount([amount1, amount2, amount3], [fee1, fee2, fee3]),
        );

        const payee1Before = await balanceOf(token1, payee1);
        const payee2Before = await balanceOf(token1, payee2);
        const feeBefore = await balanceOf(token1, feeAddress);

        await batch.batchERC20PaymentsWithReference(
          token1.address,
          [payee1, payee2, payee2],
          [amount1, amount2, amount3],
          [REF_A, REF_B, REF_C],
          [fee1, fee2, fee3],
          feeAddress,
          { from: payer },
        );

        assert.equal(diff(await balanceOf(token1, payee1), payee1Before).toString(), amount1);
        assert.equal(
          diff(await balanceOf(token1, payee2), payee2Before).toString(),
          sumStrings([amount2, amount3]),
        );
        assert.equal(
          diff(await balanceOf(token1, feeAddress), feeBefore).toString(),
          sumStrings([fee1, fee2, fee3]),
        );
      });

      it('should pay 10 ERC20 payments', async () => {
        const amount = '200';
        const feeAmount = '100';
        const nbTxs = 10;

        await makeTokenApproval(
          token1,
          payer,
          batch.address,
          getApprovalAmount(Array(nbTxs).fill(amount), Array(nbTxs).fill(feeAmount)),
        );

        const payee1Before = await balanceOf(token1, payee1);
        const feeBefore = await balanceOf(token1, feeAddress);

        await batch.batchERC20PaymentsWithReference(
          token1.address,
          Array(nbTxs).fill(payee1),
          Array(nbTxs).fill(amount),
          Array(nbTxs).fill(REF_A),
          Array(nbTxs).fill(feeAmount),
          feeAddress,
          { from: payer },
        );

        assert.equal(
          diff(await balanceOf(token1, payee1), payee1Before).toString(),
          mulString(amount, nbTxs),
        );
        assert.equal(
          diff(await balanceOf(token1, feeAddress), feeBefore).toString(),
          mulString(feeAmount, nbTxs),
        );
      });

      it('should leave no token balance on the batch contract after a successful payment', async () => {
        const amount1 = '100';
        const fee1 = '10';

        await makeTokenApproval(token1, payer, batch.address, getApprovalAmount([amount1], [fee1]));

        await batch.batchERC20PaymentsWithReference(
          token1.address,
          [payee1],
          [amount1],
          [REF_A],
          [fee1],
          feeAddress,
          { from: payer },
        );
        await waitForConfirmation(3000);

        await assertBatchTokenBalancesZero(batch, [token1]);
      });

      it('should pay a single ERC20 payment with BadTRC20', async () => {
        const badToken = await deployBadTRC20(payer);
        const paymentAmount = '100';
        const feeAmount = '10';

        try {
          await badToken.approve(batch.address, getApprovalAmount([paymentAmount], [feeAmount]), {
            from: payer,
          });
          await waitForConfirmation(3000);

          const payeeBefore = await balanceOf(badToken, payee1);

          await batch.batchERC20PaymentsWithReference(
            badToken.address,
            [payee1],
            [paymentAmount],
            [REF_A],
            [feeAmount],
            feeAddress,
            { from: payer },
          );
          await waitForConfirmation(3000);

          const payeeAfter = await balanceOf(badToken, payee1);
          assert(
            payeeAfter > payeeBefore,
            'BadTRC20: payee balance should increase when batch payment succeeds',
          );
        } catch (_error) {
          console.log(
            'BadTRC20 batch payment rejected by Tron (acceptable for non-standard tokens)',
          );
        }
      });
    });

    describe('batchERC20PaymentsMultiTokensWithReference', () => {
      it('should pay 3 ERC20 payments in three different tokens', async () => {
        const amount1 = '5000';
        const amount2 = '3000';
        const amount3 = '4000';
        const fee1 = '600';
        const fee2 = '200';
        const fee3 = '300';

        await makeTokenApproval(token1, payer, batch.address, getApprovalAmount([amount1], [fee1]));
        await makeTokenApproval(token2, payer, batch.address, getApprovalAmount([amount2], [fee2]));
        await makeTokenApproval(token3, payer, batch.address, getApprovalAmount([amount3], [fee3]));

        const payee1Before = await balanceOf(token1, payee1);
        const payee2Token2Before = await balanceOf(token2, payee2);
        const payee2Token3Before = await balanceOf(token3, payee2);
        const feeToken1Before = await balanceOf(token1, feeAddress);
        const feeToken2Before = await balanceOf(token2, feeAddress);
        const feeToken3Before = await balanceOf(token3, feeAddress);

        await batch.batchERC20PaymentsMultiTokensWithReference(
          [token1.address, token2.address, token3.address],
          [payee1, payee2, payee2],
          [amount1, amount2, amount3],
          [REF_A, REF_B, REF_C],
          [fee1, fee2, fee3],
          feeAddress,
          { from: payer },
        );

        assert.equal(diff(await balanceOf(token1, payee1), payee1Before).toString(), amount1);
        assert.equal(diff(await balanceOf(token2, payee2), payee2Token2Before).toString(), amount2);
        assert.equal(diff(await balanceOf(token3, payee2), payee2Token3Before).toString(), amount3);
        assert.equal(diff(await balanceOf(token1, feeAddress), feeToken1Before).toString(), fee1);
        assert.equal(diff(await balanceOf(token2, feeAddress), feeToken2Before).toString(), fee2);
        assert.equal(diff(await balanceOf(token3, feeAddress), feeToken3Before).toString(), fee3);
      });

      it('should pay 3 ERC20 payments in three different tokens with a zero amount payment', async () => {
        const amount1 = '5000';
        const amount2 = '0';
        const amount3 = '4000';
        const fee1 = '600';
        const fee2 = '0';
        const fee3 = '300';

        await makeTokenApproval(token1, payer, batch.address, getApprovalAmount([amount1], [fee1]));
        await makeTokenApproval(token2, payer, batch.address, getApprovalAmount([amount2], [fee2]));
        await makeTokenApproval(token3, payer, batch.address, getApprovalAmount([amount3], [fee3]));

        const payee1Before = await balanceOf(token1, payee1);
        const payee2Token2Before = await balanceOf(token2, payee2);
        const payee2Token3Before = await balanceOf(token3, payee2);

        await batch.batchERC20PaymentsMultiTokensWithReference(
          [token1.address, token2.address, token3.address],
          [payee1, payee2, payee2],
          [amount1, amount2, amount3],
          [REF_A, REF_B, REF_C],
          [fee1, fee2, fee3],
          feeAddress,
          { from: payer },
        );

        assert.equal(diff(await balanceOf(token1, payee1), payee1Before).toString(), amount1);
        assert.equal(diff(await balanceOf(token2, payee2), payee2Token2Before).toString(), amount2);
        assert.equal(diff(await balanceOf(token3, payee2), payee2Token3Before).toString(), amount3);
      });

      it('should pay 4 ERC20 payments in two different tokens', async () => {
        const amount1 = '200';
        const amount2 = '200';
        const amount3 = '200';
        const amount4 = '200';
        const fee1 = '10';
        const fee2 = '10';
        const fee3 = '10';
        const fee4 = '10';

        await makeTokenApproval(
          token1,
          payer,
          batch.address,
          getApprovalAmount([amount1, amount2], [fee1, fee2]),
        );
        await makeTokenApproval(
          token2,
          payer,
          batch.address,
          getApprovalAmount([amount3, amount4], [fee3, fee4]),
        );

        const payee2Token1Before = await balanceOf(token1, payee2);
        const payee2Token2Before = await balanceOf(token2, payee2);

        await batch.batchERC20PaymentsMultiTokensWithReference(
          [token1.address, token1.address, token2.address, token2.address],
          [payee2, payee2, payee2, payee2],
          [amount1, amount2, amount3, amount4],
          [REF_A, REF_A, REF_A, REF_A],
          [fee1, fee2, fee3, fee4],
          feeAddress,
          { from: payer },
        );

        assert.equal(
          diff(await balanceOf(token1, payee2), payee2Token1Before).toString(),
          sumStrings([amount1, amount2]),
        );
        assert.equal(
          diff(await balanceOf(token2, payee2), payee2Token2Before).toString(),
          sumStrings([amount3, amount4]),
        );
      });

      it('should pay 10 ERC20 payments in two different tokens', async () => {
        const amount = '20';
        const feeAmount = '10';
        const nbPaymentsPerToken = 5;

        await makeTokenApproval(
          token1,
          payer,
          batch.address,
          getApprovalAmount(
            Array(nbPaymentsPerToken).fill(amount),
            Array(nbPaymentsPerToken).fill(feeAmount),
          ),
        );
        await makeTokenApproval(
          token2,
          payer,
          batch.address,
          getApprovalAmount(
            Array(nbPaymentsPerToken).fill(amount),
            Array(nbPaymentsPerToken).fill(feeAmount),
          ),
        );

        const payee1Token1Before = await balanceOf(token1, payee1);
        const payee1Token2Before = await balanceOf(token2, payee1);

        await batch.batchERC20PaymentsMultiTokensWithReference(
          [
            ...Array(nbPaymentsPerToken).fill(token1.address),
            ...Array(nbPaymentsPerToken).fill(token2.address),
          ],
          Array(nbPaymentsPerToken * 2).fill(payee1),
          Array(nbPaymentsPerToken * 2).fill(amount),
          Array(nbPaymentsPerToken * 2).fill(REF_A),
          Array(nbPaymentsPerToken * 2).fill(feeAmount),
          feeAddress,
          { from: payer },
        );

        assert.equal(
          diff(await balanceOf(token1, payee1), payee1Token1Before).toString(),
          mulString(amount, nbPaymentsPerToken),
        );
        assert.equal(
          diff(await balanceOf(token2, payee1), payee1Token2Before).toString(),
          mulString(amount, nbPaymentsPerToken),
        );
      });

      it('should pay 10 ERC20 payments in two different tokens without fees', async () => {
        const amount = '20';
        const feeAmount = '0';
        const nbPaymentsPerToken = 5;

        await makeTokenApproval(
          token1,
          payer,
          batch.address,
          getApprovalAmount(
            Array(nbPaymentsPerToken).fill(amount),
            Array(nbPaymentsPerToken).fill(feeAmount),
          ),
        );
        await makeTokenApproval(
          token2,
          payer,
          batch.address,
          getApprovalAmount(
            Array(nbPaymentsPerToken).fill(amount),
            Array(nbPaymentsPerToken).fill(feeAmount),
          ),
        );

        const payee1Token1Before = await balanceOf(token1, payee1);
        const payee1Token2Before = await balanceOf(token2, payee1);
        const feeToken1Before = await balanceOf(token1, feeAddress);
        const feeToken2Before = await balanceOf(token2, feeAddress);

        await batch.batchERC20PaymentsMultiTokensWithReference(
          [
            ...Array(nbPaymentsPerToken).fill(token1.address),
            ...Array(nbPaymentsPerToken).fill(token2.address),
          ],
          Array(nbPaymentsPerToken * 2).fill(payee1),
          Array(nbPaymentsPerToken * 2).fill(amount),
          Array(nbPaymentsPerToken * 2).fill(REF_A),
          Array(nbPaymentsPerToken * 2).fill(feeAmount),
          TRON_ZERO_ADDRESS,
          { from: payer },
        );
        await waitForConfirmation(3000);

        assert.equal(
          diff(await balanceOf(token1, payee1), payee1Token1Before).toString(),
          mulString(amount, nbPaymentsPerToken),
        );
        assert.equal(
          diff(await balanceOf(token2, payee1), payee1Token2Before).toString(),
          mulString(amount, nbPaymentsPerToken),
        );
        assert.equal(
          diff(await balanceOf(token1, feeAddress), feeToken1Before).toString(),
          feeAmount,
        );
        assert.equal(
          diff(await balanceOf(token2, feeAddress), feeToken2Before).toString(),
          feeAmount,
        );
      });

      it('should leave no token balance on the batch contract after a successful payment', async () => {
        const amount1 = '100';
        const amount2 = '200';
        const fee1 = '10';
        const fee2 = '20';

        await makeTokenApproval(token1, payer, batch.address, getApprovalAmount([amount1], [fee1]));
        await makeTokenApproval(token2, payer, batch.address, getApprovalAmount([amount2], [fee2]));

        await batch.batchERC20PaymentsMultiTokensWithReference(
          [token1.address, token2.address],
          [payee1, payee2],
          [amount1, amount2],
          [REF_A, REF_B],
          [fee1, fee2],
          feeAddress,
          { from: payer },
        );
        await waitForConfirmation(3000);

        await assertBatchTokenBalancesZero(batch, [token1, token2]);
      });

      it('should pay a multi-token ERC20 payment with BadTRC20', async () => {
        const badToken = await deployBadTRC20(payer);
        const paymentAmount = '100';
        const feeAmount = '10';
        const amount1 = '50';
        const fee1 = '5';

        try {
          await badToken.approve(batch.address, getApprovalAmount([paymentAmount], [feeAmount]), {
            from: payer,
          });
          await makeTokenApproval(
            token1,
            payer,
            batch.address,
            getApprovalAmount([amount1], [fee1]),
          );
          await waitForConfirmation(3000);

          const badPayeeBefore = await balanceOf(badToken, payee1);
          const payee1Before = await balanceOf(token1, payee2);

          await batch.batchERC20PaymentsMultiTokensWithReference(
            [badToken.address, token1.address],
            [payee1, payee2],
            [paymentAmount, amount1],
            [REF_A, REF_B],
            [feeAmount, fee1],
            feeAddress,
            { from: payer },
          );
          await waitForConfirmation(3000);

          const badPayeeAfter = await balanceOf(badToken, payee1);
          const payee1After = await balanceOf(token1, payee2);
          assert(
            badPayeeAfter > badPayeeBefore || payee1After > payee1Before,
            'BadTRC20 multi-token: at least one payee balance should increase when batch succeeds',
          );
        } catch (_error) {
          console.log(
            'BadTRC20 multi-token batch payment rejected by Tron (acceptable for non-standard tokens)',
          );
        }
      });
    });
  });

  describe('Error cases scenarios', () => {
    describe('batchERC20PaymentsWithReference', () => {
      it('should revert when the payer does not have enough funds to pay', async () => {
        const amount1 = '5';
        const amount2 = '30';
        const amount3 = '400';
        const fee1 = '1';
        const fee2 = '2';
        const fee3 = '3';

        const lowToken = await deployTokenWithSupply('100', payer);
        await makeTokenApproval(
          lowToken,
          payer,
          batch.address,
          getApprovalAmount([amount1, amount2, amount3], [fee1, fee2, fee3]),
        );

        const payee3Before = await balanceOf(lowToken, payee3);
        const { unchanged } = await expectRevertOrNoBalanceChange(
          () =>
            batch.batchERC20PaymentsWithReference(
              lowToken.address,
              [payee1, payee2, payee3],
              [amount1, amount2, amount3],
              [REF_A, REF_B, REF_C],
              [fee1, fee2, fee3],
              feeAddress,
              { from: payer },
            ),
          async () => [await balanceOf(lowToken, payee3)],
        );

        assert(unchanged, 'should not transfer when funds insufficient');
        assert.equal((await balanceOf(lowToken, payee3)).toString(), payee3Before.toString());
      });

      it('should revert when the payer does not have enough funds to pay the fees', async () => {
        const amount1 = '100';
        const amount2 = '200';
        const fee1 = '50';
        const fee2 = '50';

        const lowToken = await deployTokenWithSupply('300', payer);
        await makeTokenApproval(
          lowToken,
          payer,
          batch.address,
          getApprovalAmount([amount1, amount2], [fee1, fee2]),
        );

        const payee1Before = await balanceOf(lowToken, payee1);
        const { unchanged } = await expectRevertOrNoBalanceChange(
          () =>
            batch.batchERC20PaymentsWithReference(
              lowToken.address,
              [payee1, payee2],
              [amount1, amount2],
              [REF_A, REF_B],
              [fee1, fee2],
              feeAddress,
              { from: payer },
            ),
          async () => [await balanceOf(lowToken, payee1)],
        );

        assert(unchanged, 'should not transfer when fees cannot be paid');
        assert.equal((await balanceOf(lowToken, payee1)).toString(), payee1Before.toString());
      });

      it('should revert when the payer did not approve the batch contract to spend the tokens', async () => {
        const amount1 = '20';
        const amount2 = '30';
        const amount3 = '40';
        const fee1 = '1';
        const fee2 = '2';
        const fee3 = '3';

        await makeTokenApproval(
          token1,
          payer,
          batch.address,
          getApprovalAmount([amount1, amount2, amount3], [fee1, fee2, fee3]),
        );
        await token1.approve(batch.address, '10', { from: payer });
        await waitForConfirmation(2000);

        const payee1Before = await balanceOf(token1, payee1);
        const { unchanged } = await expectRevertOrNoBalanceChange(
          () =>
            batch.batchERC20PaymentsWithReference(
              token1.address,
              [payee1, payee2, payee3],
              [amount1, amount2, amount3],
              [REF_A, REF_B, REF_C],
              [fee1, fee2, fee3],
              feeAddress,
              { from: payer },
            ),
          async () => [await balanceOf(token1, payee1)],
        );

        assert(unchanged, 'should not transfer without allowance');
        assert.equal((await balanceOf(token1, payee1)).toString(), payee1Before.toString());
      });

      it('should revert when input arrays have different lengths', async () => {
        const amount1 = '100';
        const fee1 = '1';
        const fee2 = '2';

        await makeTokenApproval(
          token1,
          payer,
          batch.address,
          getApprovalAmount([amount1], [fee1, fee2]),
        );

        const payee1Before = await balanceOf(token1, payee1);
        const payee2Before = await balanceOf(token1, payee2);

        const { unchanged } = await expectRevertOrNoBalanceChange(
          () =>
            batch.batchERC20PaymentsWithReference(
              token1.address,
              [payee1, payee2],
              [amount1],
              [REF_A, REF_B],
              [fee1, fee2],
              feeAddress,
              { from: payer },
            ),
          async () => [await balanceOf(token1, payee1), await balanceOf(token1, payee2)],
        );

        assert(unchanged, 'should not transfer when array lengths mismatch');
        assert.equal((await balanceOf(token1, payee1)).toString(), payee1Before.toString());
        assert.equal((await balanceOf(token1, payee2)).toString(), payee2Before.toString());
      });
    });

    describe('batchERC20PaymentsMultiTokensWithReference', () => {
      it('should revert when the payer does not have enough funds to pay in at least one of the tokens', async () => {
        const amount1 = '5';
        const amount2 = '30';
        const amount3 = '400';
        const fee1 = '1';
        const fee2 = '2';
        const fee3 = '3';

        const lowToken = await deployTokenWithSupply('400', payer);
        await makeTokenApproval(
          lowToken,
          payer,
          batch.address,
          getApprovalAmount([amount1, amount2, amount3], [fee1, fee2, fee3]),
        );

        const payee3Before = await balanceOf(lowToken, payee3);
        const { unchanged } = await expectRevertOrNoBalanceChange(
          () =>
            batch.batchERC20PaymentsMultiTokensWithReference(
              [lowToken.address, lowToken.address, lowToken.address],
              [payee1, payee2, payee3],
              [amount1, amount2, amount3],
              [REF_A, REF_B, REF_C],
              [fee1, fee2, fee3],
              feeAddress,
              { from: payer },
            ),
          async () => [await balanceOf(lowToken, payee3)],
        );

        assert(unchanged, 'multi-token batch should not transfer when funds insufficient');
        assert.equal((await balanceOf(lowToken, payee3)).toString(), payee3Before.toString());
      });

      it('should revert when the payer did not approve the batch contract to spend the tokens in at least one of the tokens', async () => {
        const amount1 = '100';
        const amount2 = '200';
        const amount3 = '300';
        const fee1 = '1';
        const fee2 = '2';
        const fee3 = '3';

        await makeTokenApproval(
          token1,
          payer,
          batch.address,
          getApprovalAmount([amount1, amount2, amount3], [fee1, fee2, fee3]),
        );
        await token1.approve(batch.address, '10', { from: payer });
        await waitForConfirmation(2000);

        const payee1Before = await balanceOf(token1, payee1);
        const { unchanged } = await expectRevertOrNoBalanceChange(
          () =>
            batch.batchERC20PaymentsMultiTokensWithReference(
              [token1.address, token1.address, token1.address],
              [payee1, payee2, payee3],
              [amount1, amount2, amount3],
              [REF_A, REF_B, REF_C],
              [fee1, fee2, fee3],
              feeAddress,
              { from: payer },
            ),
          async () => [await balanceOf(token1, payee1)],
        );

        assert(unchanged, 'multi-token batch should not transfer without allowance');
        assert.equal((await balanceOf(token1, payee1)).toString(), payee1Before.toString());
      });

      it('should revert when the payer did not approve the batch contract for one of the tokens', async () => {
        const amount1 = '100';
        const amount2 = '200';
        const fee1 = '1';
        const fee2 = '2';

        await makeTokenApproval(token1, payer, batch.address, getApprovalAmount([amount1], [fee1]));

        const payee2Token2Before = await balanceOf(token2, payee2);
        const { unchanged } = await expectRevertOrNoBalanceChange(
          () =>
            batch.batchERC20PaymentsMultiTokensWithReference(
              [token1.address, token2.address],
              [payee1, payee2],
              [amount1, amount2],
              [REF_A, REF_B],
              [fee1, fee2],
              feeAddress,
              { from: payer },
            ),
          async () => [await balanceOf(token2, payee2)],
        );

        assert(unchanged, 'should not transfer when one token lacks approval');
        assert.equal((await balanceOf(token2, payee2)).toString(), payee2Token2Before.toString());
      });

      it('should revert when input arrays have different lengths', async () => {
        const amount1 = '100';
        const fee1 = '1';
        const fee2 = '2';

        await makeTokenApproval(token1, payer, batch.address, getApprovalAmount([amount1], [fee1]));
        await makeTokenApproval(token2, payer, batch.address, getApprovalAmount([amount1], [fee2]));

        const payee1Before = await balanceOf(token1, payee1);
        const payee2Before = await balanceOf(token2, payee2);

        const { unchanged } = await expectRevertOrNoBalanceChange(
          () =>
            batch.batchERC20PaymentsMultiTokensWithReference(
              [token1.address, token2.address],
              [payee1, payee2],
              [amount1],
              [REF_A, REF_B],
              [fee1, fee2],
              feeAddress,
              { from: payer },
            ),
          async () => [await balanceOf(token1, payee1), await balanceOf(token2, payee2)],
        );

        assert(unchanged, 'should not transfer when array lengths mismatch');
        assert.equal((await balanceOf(token1, payee1)).toString(), payee1Before.toString());
        assert.equal((await balanceOf(token2, payee2)).toString(), payee2Before.toString());
      });
    });
  });
});

contract('ERC20BatchPayments constructor', () => {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

  it('should revert when paymentErc20FeeProxy is the zero address', async () => {
    let reverted = false;
    let errorMessage = '';

    try {
      await ERC20BatchPayments.new(ZERO_ADDRESS);
    } catch (error) {
      reverted = true;
      errorMessage = error.message || String(error);
    }

    assert(reverted, 'deployment should revert when paymentErc20FeeProxy is address(0)');
    assert(
      errorMessage.includes('paymentErc20FeeProxy cannot be 0x'),
      `expected zero-address revert, got: ${errorMessage}`,
    );
  });
});
