//! Build script for generating protobuf types

fn main() -> Result<(), Box<dyn std::error::Error>> {
    prost_build::compile_protos(&["proto/payments.proto"], &["proto/"])?;
    Ok(())
}
