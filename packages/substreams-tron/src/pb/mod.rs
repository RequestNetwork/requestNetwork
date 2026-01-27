// @generated
// Protobuf types for Request Network TRON Substreams

// TRON protocol types from StreamingFast
pub mod protocol {
    include!("protocol.rs");
}

pub mod sf {
    pub mod tron {
        pub mod r#type {
            // @@ protoc_insertion_point(attribute:sf.tron.type.v1)
            pub mod v1 {
                include!("sf.tron.type.v1.rs");
                // @@ protoc_insertion_point(sf.tron.type.v1)
            }
        }
    }
}

// Request Network payment types
pub mod request {
    pub mod tron {
        pub mod v1 {
            include!("request.tron.v1.rs");
        }
    }
}
