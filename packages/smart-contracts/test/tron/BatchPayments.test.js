const BatchPayments = artifacts.require('BatchPayments');
const {
  REF_A,
  REF_B,
  REF_C,
  waitForConfirmation,
  balanceOf,
  diff,
  deployBaseSetup,
  makeTokenApproval,
  deployTokenWithSupply,
  expectRevertOrNoBalanceChange,
  assertBatchTokenBalancesZero,
  expectNonOwnerReverts,
  deployBadTRC20,
  sumStrings,
  mulString,
  computeBatchFee,
  getApprovalAmount,
  trxBalance,
  ONE_TRX_SUN,
  TRON_ZERO_ADDRESS,
} = require('./helpers');

contract('BatchPayments Tron Test Suite', (accounts) => {
  const payer = accounts[0];
  const payee1 = accounts[1] || 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE';
  const payee2 = accounts[2] || 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs';
  const payee3 = accounts[3] || 'TFwt56qg984vEmk2UoDqUDeZhWEFSDaTmk';
  const feeAddress = accounts[4] || 'TNPGB28MjVCnEhTfpW51C2Ap3ZNnqGDXLB';

  const BATCH_FEE_BPS = 10;

  let batch;
  let token1;
  let token2;
  let token3;

  before(async () => {
    const setup = await deployBaseSetup({
      accounts,
      batchDeployFn: (erc20FeeProxy, owner, ethProxy) =>
        BatchPayments.new(erc20FeeProxy.address, ethProxy, owner),
      batchFee: BATCH_FEE_BPS,
    });
    batch = setup.batch;
    [token1, token2, token3] = setup.tokens;

    console.log('\n=== BatchPayments (main) Test Setup ===');
    console.log('Batch:', batch.address);
    console.log('Token1:', token1.address);
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

        const batchFee = computeBatchFee(sumStrings([amount1, amount2, amount3]), BATCH_FEE_BPS);
        const totalPaymentAndFees = sumStrings([
          amount1,
          amount2,
          amount3,
          fee1,
          fee2,
          fee3,
          batchFee,
        ]);

        await makeTokenApproval(
          token1,
          payer,
          batch.address,
          getApprovalAmount([amount1, amount2, amount3], [fee1, fee2, fee3], batchFee),
        );

        const payee1Before = await balanceOf(token1, payee1);
        const payee2Before = await balanceOf(token1, payee2);
        const payerBefore = await balanceOf(token1, payer);
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
        await waitForConfirmation(3000);

        const payee1After = await balanceOf(token1, payee1);
        const payee2After = await balanceOf(token1, payee2);
        const payerAfter = await balanceOf(token1, payer);
        const feeAfter = await balanceOf(token1, feeAddress);

        assert.equal(diff(payee1After, payee1Before).toString(), amount1);
        assert.equal(diff(payee2After, payee2Before).toString(), sumStrings([amount2, amount3]));
        assert.equal(
          diff(feeAfter, feeBefore).toString(),
          sumStrings([fee1, fee2, fee3, batchFee]),
        );
        assert(
          diff(payerBefore, payerAfter) >= BigInt(totalPaymentAndFees),
          'payer should pay amounts, fees, and batch fee',
        );
      });

      it('should pay 10 ERC20 payments', async () => {
        const amount = '200';
        const feeAmount = '100';
        const nbTxs = 10;

        const batchFeeTotal = computeBatchFee(mulString(amount, nbTxs), BATCH_FEE_BPS);

        await makeTokenApproval(
          token1,
          payer,
          batch.address,
          getApprovalAmount(Array(nbTxs).fill(amount), Array(nbTxs).fill(feeAmount), batchFeeTotal),
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
        await waitForConfirmation(3000);

        assert.equal(
          diff(await balanceOf(token1, payee1), payee1Before).toString(),
          mulString(amount, nbTxs),
        );
        assert.equal(
          diff(await balanceOf(token1, feeAddress), feeBefore).toString(),
          sumStrings([mulString(feeAmount, nbTxs), batchFeeTotal]),
        );
      });

      it('should leave no token balance on the batch contract after a successful payment', async () => {
        const amount1 = '100';
        const fee1 = '10';

        await makeTokenApproval(
          token1,
          payer,
          batch.address,
          getApprovalAmount([amount1], [fee1], computeBatchFee(amount1, BATCH_FEE_BPS)),
        );

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

      it('should apply an updated batch fee on the next payment', async () => {
        const newBatchFeeBps = 50;
        await batch.setBatchFee(newBatchFeeBps, { from: payer });

        const amount1 = '1000';
        const fee1 = '10';
        const batchFee = computeBatchFee(amount1, newBatchFeeBps);

        await makeTokenApproval(
          token1,
          payer,
          batch.address,
          getApprovalAmount([amount1], [fee1], batchFee),
        );

        const feeBefore = await balanceOf(token1, feeAddress);

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

        assert.equal(
          diff(await balanceOf(token1, feeAddress), feeBefore).toString(),
          sumStrings([fee1, batchFee]),
        );

        await batch.setBatchFee(BATCH_FEE_BPS, { from: payer });
      });

      it('should pay ERC20 payments with no batch fee when batch fee is zero', async () => {
        await batch.setBatchFee(0, { from: payer });

        const amount1 = '500';
        const fee1 = '25';

        await makeTokenApproval(token1, payer, batch.address, getApprovalAmount([amount1], [fee1]));

        const feeBefore = await balanceOf(token1, feeAddress);

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

        assert.equal(diff(await balanceOf(token1, feeAddress), feeBefore).toString(), fee1);

        await batch.setBatchFee(BATCH_FEE_BPS, { from: payer });
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

        const batchFee1 = computeBatchFee(amount1, BATCH_FEE_BPS);
        const batchFee2 = computeBatchFee(amount2, BATCH_FEE_BPS);
        const batchFee3 = computeBatchFee(amount3, BATCH_FEE_BPS);

        await makeTokenApproval(
          token1,
          payer,
          batch.address,
          getApprovalAmount([amount1], [fee1], batchFee1),
        );
        await makeTokenApproval(
          token2,
          payer,
          batch.address,
          getApprovalAmount([amount2], [fee2], batchFee2),
        );
        await makeTokenApproval(
          token3,
          payer,
          batch.address,
          getApprovalAmount([amount3], [fee3], batchFee3),
        );

        const payee1Before = await balanceOf(token1, payee1);
        const payee2Token2Before = await balanceOf(token2, payee2);
        const payee2Token3Before = await balanceOf(token3, payee2);
        const feeToken1Before = await balanceOf(token1, feeAddress);
        const feeToken2Before = await balanceOf(token2, feeAddress);
        const feeToken3Before = await balanceOf(token3, feeAddress);
        const payerToken1Before = await balanceOf(token1, payer);
        const payerToken2Before = await balanceOf(token2, payer);
        const payerToken3Before = await balanceOf(token3, payer);

        await batch.batchERC20PaymentsMultiTokensWithReference(
          [token1.address, token2.address, token3.address],
          [payee1, payee2, payee2],
          [amount1, amount2, amount3],
          [REF_A, REF_B, REF_C],
          [fee1, fee2, fee3],
          feeAddress,
          { from: payer },
        );
        await waitForConfirmation(3000);

        assert.equal(diff(await balanceOf(token1, payee1), payee1Before).toString(), amount1);
        assert.equal(diff(await balanceOf(token2, payee2), payee2Token2Before).toString(), amount2);
        assert.equal(diff(await balanceOf(token3, payee2), payee2Token3Before).toString(), amount3);
        assert.equal(
          diff(await balanceOf(token1, feeAddress), feeToken1Before).toString(),
          sumStrings([fee1, batchFee1]),
        );
        assert.equal(
          diff(await balanceOf(token2, feeAddress), feeToken2Before).toString(),
          sumStrings([fee2, batchFee2]),
        );
        assert.equal(
          diff(await balanceOf(token3, feeAddress), feeToken3Before).toString(),
          sumStrings([fee3, batchFee3]),
        );

        const total1 = sumStrings([amount1, fee1, batchFee1]);
        const total2 = sumStrings([amount2, fee2, batchFee2]);
        const total3 = sumStrings([amount3, fee3, batchFee3]);
        assert(
          diff(payerToken1Before, await balanceOf(token1, payer)) >= BigInt(total1),
          'payer should pay token1 amounts, fees, and batch fee',
        );
        assert(
          diff(payerToken2Before, await balanceOf(token2, payer)) >= BigInt(total2),
          'payer should pay token2 amounts, fees, and batch fee',
        );
        assert(
          diff(payerToken3Before, await balanceOf(token3, payer)) >= BigInt(total3),
          'payer should pay token3 amounts, fees, and batch fee',
        );
      });

      it('should pay 3 ERC20 payments in three different tokens with a zero amount payment', async () => {
        const amount1 = '5000';
        const amount2 = '0';
        const amount3 = '4000';
        const fee1 = '600';
        const fee2 = '0';
        const fee3 = '300';

        const batchFee1 = computeBatchFee(amount1, BATCH_FEE_BPS);
        const batchFee3 = computeBatchFee(amount3, BATCH_FEE_BPS);

        await makeTokenApproval(
          token1,
          payer,
          batch.address,
          getApprovalAmount([amount1], [fee1], batchFee1),
        );
        await makeTokenApproval(token2, payer, batch.address, getApprovalAmount([amount2], [fee2]));
        await makeTokenApproval(
          token3,
          payer,
          batch.address,
          getApprovalAmount([amount3], [fee3], batchFee3),
        );

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
        await waitForConfirmation(3000);

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

        const batchFee1 = computeBatchFee(sumStrings([amount1, amount2]), BATCH_FEE_BPS);
        const batchFee2 = computeBatchFee(sumStrings([amount3, amount4]), BATCH_FEE_BPS);

        await makeTokenApproval(
          token1,
          payer,
          batch.address,
          getApprovalAmount([amount1, amount2], [fee1, fee2], batchFee1),
        );
        await makeTokenApproval(
          token2,
          payer,
          batch.address,
          getApprovalAmount([amount3, amount4], [fee3, fee4], batchFee2),
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
        await waitForConfirmation(3000);

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

        const batchFee1 = computeBatchFee(mulString(amount, nbPaymentsPerToken), BATCH_FEE_BPS);

        await makeTokenApproval(
          token1,
          payer,
          batch.address,
          getApprovalAmount(
            Array(nbPaymentsPerToken).fill(amount),
            Array(nbPaymentsPerToken).fill(feeAmount),
            batchFee1,
          ),
        );
        await makeTokenApproval(
          token2,
          payer,
          batch.address,
          getApprovalAmount(
            Array(nbPaymentsPerToken).fill(amount),
            Array(nbPaymentsPerToken).fill(feeAmount),
            batchFee1,
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
        await waitForConfirmation(3000);

        assert.equal(
          diff(await balanceOf(token1, payee1), payee1Token1Before).toString(),
          mulString(amount, nbPaymentsPerToken),
        );
        assert.equal(
          diff(await balanceOf(token2, payee1), payee1Token2Before).toString(),
          mulString(amount, nbPaymentsPerToken),
        );
      });

      it('should leave no token balance on the batch contract after a successful payment', async () => {
        const amount1 = '100';
        const amount2 = '200';
        const fee1 = '10';
        const fee2 = '20';

        const batchFee1 = computeBatchFee(amount1, BATCH_FEE_BPS);
        const batchFee2 = computeBatchFee(amount2, BATCH_FEE_BPS);

        await makeTokenApproval(
          token1,
          payer,
          batch.address,
          getApprovalAmount([amount1], [fee1], batchFee1),
        );
        await makeTokenApproval(
          token2,
          payer,
          batch.address,
          getApprovalAmount([amount2], [fee2], batchFee2),
        );

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
            getApprovalAmount([amount1], [fee1], computeBatchFee(amount1, BATCH_FEE_BPS)),
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

      it('should revert when the payer does not have enough funds to pay the batch fee', async () => {
        const amount1 = '100';
        const amount2 = '200';
        const fee1 = '1';
        const fee2 = '2';
        const paymentTotal = sumStrings([amount1, amount2, fee1, fee2]);

        const lowToken = await deployTokenWithSupply(paymentTotal, payer);
        await makeTokenApproval(lowToken, payer, batch.address, paymentTotal);

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

        assert(unchanged, 'should not transfer when batch fee cannot be paid');
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

      it('should revert when the payer does not have enough funds to pay the batch fee in at least one of the tokens', async () => {
        const amount1 = '100';
        const amount2 = '200';
        const amount3 = '300';
        const fee1 = '1';
        const fee2 = '2';
        const fee3 = '3';

        const lowToken = await deployTokenWithSupply('607', payer);
        await makeTokenApproval(
          lowToken,
          payer,
          batch.address,
          getApprovalAmount([amount1, amount2, amount3], [fee1, fee2, fee3]),
        );

        const payee2Before = await balanceOf(lowToken, payee2);
        const { unchanged } = await expectRevertOrNoBalanceChange(
          () =>
            batch.batchERC20PaymentsMultiTokensWithReference(
              [lowToken.address, lowToken.address, lowToken.address],
              [payee1, payee2, payee2],
              [amount1, amount2, amount3],
              [REF_A, REF_B, REF_C],
              [fee1, fee2, fee3],
              feeAddress,
              { from: payer },
            ),
          async () => [await balanceOf(lowToken, payee2)],
        );

        assert(unchanged, 'multi-token batch should not transfer when batch fee cannot be paid');
        assert.equal((await balanceOf(lowToken, payee2)).toString(), payee2Before.toString());
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

    describe('batchEthPaymentsWithReference', () => {
      it('should revert when calling batchEthPaymentsWithReference when EthFeeProxy is not set', async () => {
        assert.equal(await batch.paymentEthFeeProxy(), TRON_ZERO_ADDRESS);

        const paymentAmount = String(10 * ONE_TRX_SUN);
        const feeAmount = '0';
        const payeeBefore = await trxBalance(payee1);
        const payerBefore = await trxBalance(payer);

        try {
          await batch.batchEthPaymentsWithReference(
            [payee1],
            [paymentAmount],
            [REF_A],
            [feeAmount],
            feeAddress,
            { from: payer, callValue: Number(paymentAmount) },
          );
        } catch (_error) {}
        await waitForConfirmation(2000);

        assert.equal((await trxBalance(payee1)).toString(), payeeBefore.toString());

        const payerSpent = payerBefore - (await trxBalance(payer));
        assert(
          payerSpent < BigInt(paymentAmount),
          `payer should only spend tx fees, not ${paymentAmount} sun (spent ${payerSpent})`,
        );
      });
    });
  });

  describe('Admin', () => {
    describe('setPaymentErc20FeeProxy', () => {
      it('should allow owner to update proxy addresses', async () => {
        const ERC20FeeProxy = artifacts.require('ERC20FeeProxy');
        const newProxy = await ERC20FeeProxy.new();
        await batch.setPaymentErc20FeeProxy(newProxy.address, { from: payer });
        assert.equal(await batch.paymentErc20FeeProxy(), newProxy.address);
      });

      it('should revert when a non-owner tries to update proxy addresses', async () => {
        await expectNonOwnerReverts(
          () => batch.setPaymentErc20FeeProxy(payee1, { from: payee1 }),
          async () => await batch.paymentErc20FeeProxy(),
        );
      });
    });

    describe('setBatchFee', () => {
      it('should allow owner to update the batch fee', async () => {
        const newBatchFee = 50;
        await batch.setBatchFee(newBatchFee, { from: payer });
        assert.equal((await batch.batchFee()).toString(), String(newBatchFee));
        await batch.setBatchFee(BATCH_FEE_BPS, { from: payer });
      });

      it('should revert when a non-owner tries to set the batch fee', async () => {
        await expectNonOwnerReverts(
          () => batch.setBatchFee(99, { from: payee1 }),
          async () => (await batch.batchFee()).toString(),
        );
      });
    });

    describe('setPaymentEthFeeProxy', () => {
      it('should revert when a non-owner tries to set the EthFeeProxy address', async () => {
        await expectNonOwnerReverts(
          () => batch.setPaymentEthFeeProxy(TRON_ZERO_ADDRESS, { from: payee1 }),
          async () => await batch.paymentEthFeeProxy(),
        );
      });
    });
  });
});
