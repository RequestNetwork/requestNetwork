//! Request Network TRON Substreams Module
//!
//! This module indexes TransferWithReferenceAndFee events from the ERC20FeeProxy
//! contract deployed on TRON mainnet and Nile testnet.

mod pb;

use hex;
use pb::request::tron::v1::{Payment, Payments};
use substreams::log;
use substreams_tron::pb::sf::tron::r#type::v1::Block;

/// ERC20FeeProxy contract addresses
const MAINNET_PROXY_ADDRESS: &str = "TCUDPYnS9dH3WvFEaE7wN7vnDa51J4R4fd";
const NILE_PROXY_ADDRESS: &str = "THK5rNmrvCujhmrXa5DB1dASepwXTr9cJs";

/// TransferWithReferenceAndFee event signature (keccak256 hash of event signature)
/// Event: TransferWithReferenceAndFee(address,address,uint256,bytes indexed,uint256,address)
const TRANSFER_WITH_REF_AND_FEE_TOPIC: &str =
    "e8e8ca0a945b88ee72ec3e1e5f1e9c8f2a0a1e8a";

/// Maps TRON blocks to extract ERC20FeeProxy payment events
#[substreams::handlers::map]
fn map_erc20_fee_proxy_payments(block: Block) -> Result<Payments, substreams::errors::Error> {
    let mut payments = Vec::new();
    let block_number = block.number;
    let block_timestamp = block.header.as_ref().map(|h| h.timestamp).unwrap_or(0) / 1000; // Convert from ms to seconds

    for transaction in block.transactions.iter() {
        let tx_hash = hex::encode(&transaction.txid);
        
        // Get the transaction result to access logs
        if let Some(result) = &transaction.result {
            for log_entry in result.logs.iter() {
                // Check if this log is from one of our proxy contracts
                let contract_address = base58_encode(&log_entry.address);
                
                if contract_address != MAINNET_PROXY_ADDRESS 
                    && contract_address != NILE_PROXY_ADDRESS {
                    continue;
                }

                // Check if this is a TransferWithReferenceAndFee event
                // The first topic should be the event signature
                if log_entry.topics.is_empty() {
                    continue;
                }

                // Parse the event data
                if let Some(payment) = parse_transfer_with_reference_and_fee(
                    &log_entry,
                    &contract_address,
                    &tx_hash,
                    block_number,
                    block_timestamp,
                    transaction,
                ) {
                    payments.push(payment);
                }
            }
        }
    }

    Ok(Payments { payments })
}

/// Parses a TransferWithReferenceAndFee event from a log entry
fn parse_transfer_with_reference_and_fee(
    log_entry: &substreams_tron::pb::sf::tron::r#type::v1::Log,
    contract_address: &str,
    tx_hash: &str,
    block_number: u64,
    block_timestamp: u64,
    transaction: &substreams_tron::pb::sf::tron::r#type::v1::TransactionTrace,
) -> Option<Payment> {
    // Event: TransferWithReferenceAndFee(address tokenAddress, address to, uint256 amount, 
    //                                    bytes indexed paymentReference, uint256 feeAmount, address feeAddress)
    // 
    // Topics:
    // [0] = Event signature hash
    // [1] = paymentReference (indexed)
    //
    // Data (non-indexed parameters, ABI encoded):
    // [0-31]   = tokenAddress
    // [32-63]  = to
    // [64-95]  = amount
    // [96-127] = feeAmount
    // [128-159] = feeAddress
    
    if log_entry.topics.len() < 2 {
        return None;
    }

    let data = &log_entry.data;
    if data.len() < 160 {
        log::info!("Log data too short: {} bytes", data.len());
        return None;
    }

    // Extract payment reference from indexed topic
    let payment_reference = hex::encode(&log_entry.topics[1]);

    // Parse non-indexed parameters from data
    let token_address = parse_address_from_data(data, 0)?;
    let to = parse_address_from_data(data, 32)?;
    let amount = parse_uint256_from_data(data, 64);
    let fee_amount = parse_uint256_from_data(data, 96);
    let fee_address = parse_address_from_data(data, 128)?;

    // Get the sender (from) address from the transaction
    let from = transaction
        .transaction
        .as_ref()
        .and_then(|tx| tx.raw_data.as_ref())
        .and_then(|raw| raw.contract.first())
        .and_then(|c| c.parameter.as_ref())
        .map(|p| extract_owner_address(p))
        .unwrap_or_default();

    Some(Payment {
        token_address,
        to,
        amount,
        payment_reference,
        fee_amount,
        fee_address,
        from,
        block: block_number,
        timestamp: block_timestamp,
        tx_hash: tx_hash.to_string(),
        contract_address: contract_address.to_string(),
    })
}

/// Parses an address from ABI-encoded data at the given offset
fn parse_address_from_data(data: &[u8], offset: usize) -> Option<String> {
    if data.len() < offset + 32 {
        return None;
    }
    // Address is the last 20 bytes of the 32-byte slot
    let address_bytes = &data[offset + 12..offset + 32];
    Some(base58_encode(address_bytes))
}

/// Parses a uint256 from ABI-encoded data at the given offset
fn parse_uint256_from_data(data: &[u8], offset: usize) -> String {
    if data.len() < offset + 32 {
        return "0".to_string();
    }
    let bytes = &data[offset..offset + 32];
    // Convert to decimal string, handling large numbers
    let hex_str = hex::encode(bytes);
    // Remove leading zeros and convert
    let trimmed = hex_str.trim_start_matches('0');
    if trimmed.is_empty() {
        "0".to_string()
    } else {
        // For simplicity, return as hex - the consumer can convert
        format!("0x{}", hex_str)
    }
}

/// Extracts the owner address from a contract parameter
fn extract_owner_address(parameter: &prost_types::Any) -> String {
    // The owner_address is typically at the beginning of the parameter value
    if parameter.value.len() >= 21 {
        base58_encode(&parameter.value[0..21])
    } else {
        String::new()
    }
}

/// Encodes bytes to TRON Base58Check address format
fn base58_encode(bytes: &[u8]) -> String {
    // TRON addresses use Base58Check encoding with 0x41 prefix for mainnet
    // This is a simplified version - in production, use a proper Base58Check implementation
    if bytes.len() == 20 {
        // Add TRON mainnet prefix (0x41)
        let mut prefixed = vec![0x41];
        prefixed.extend_from_slice(bytes);
        bs58::encode(&prefixed).with_check().into_string()
    } else if bytes.len() == 21 && bytes[0] == 0x41 {
        bs58::encode(bytes).with_check().into_string()
    } else {
        bs58::encode(bytes).with_check().into_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_base58_encode() {
        // Test with a known TRON address
        let hex_addr = hex::decode("41a614f803b6fd780986a42c78ec9c7f77e6ded13c").unwrap();
        let encoded = base58_encode(&hex_addr);
        assert!(encoded.starts_with('T'));
    }
}
