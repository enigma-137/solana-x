mod services;

use axum::{
    routing::post,
    Router,
    Json,
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use solana_client::rpc_client::RpcClient;
use solana_sdk::signature::Signature;
use std::str::FromStr;
use tower_http::cors::{CorsLayer, Any};
use services::{scraper::scrape_url, gemini::{generate_content, ContentType}};

#[derive(Deserialize)]
struct GenerateRequest {
    tx_signature: String,
    url: String,
    content_type: Option<String>, // "thread" or "article", defaults to "thread"
}

#[derive(Serialize)]
struct GenerateResponse {
    success: bool,
    content: String,
}

#[tokio::main]
async fn main() {
    dotenv::dotenv().ok();

    let rpc_url = std::env::var("SOLANA_RPC")
        .unwrap_or_else(|_| "https://api.devnet.solana.com".to_string());

    let port = std::env::var("PORT").unwrap_or_else(|_| "3001".to_string());
    let addr = format!("0.0.0.0:{}", port);

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/generate", post(generate_handler))
        .route("/health", axum::routing::get(|| async { "OK" }))
        .layer(cors)
        .with_state(rpc_url);

    println!("Backend running on http://{}", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn generate_handler(
    axum::extract::State(rpc_url): axum::extract::State<String>,
    Json(payload): Json<GenerateRequest>,
) -> Result<Json<GenerateResponse>, (StatusCode, String)> {

    // 1. Verify the transaction
    let signature = Signature::from_str(&payload.tx_signature)
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid signature".to_string()))?;

    let client = RpcClient::new(rpc_url);

    let tx = client
        .get_transaction_with_config(
            &signature,
            solana_client::rpc_config::RpcTransactionConfig {
                encoding: None,
                commitment: Some(solana_sdk::commitment_config::CommitmentConfig::confirmed()),
                max_supported_transaction_version: Some(0),
            },
        )
        .map_err(|e| (StatusCode::BAD_REQUEST, format!("Transaction not found: {}", e)))?;

    let meta = tx.transaction.meta
        .ok_or((StatusCode::BAD_REQUEST, "No transaction metadata".to_string()))?;

    if meta.err.is_some() {
        return Err((StatusCode::BAD_REQUEST, "Transaction failed on-chain".to_string()));
    }

    // 2. Scrape the URL
    let scraped = scrape_url(&payload.url)
        .await
        .map_err(|e| (StatusCode::BAD_REQUEST, e))?;

    println!("Scraped {} chars from {}", scraped.len(), payload.url);

    // 3. Generate content with Gemini
    let api_key = std::env::var("GEMINI_API_KEY")
        .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, "GEMINI_API_KEY not set".to_string()))?;

    let ctype = match payload.content_type.as_deref() {
        Some("tweet") => ContentType::Tweet,
        _ => ContentType::Thread,
    };

    let content = generate_content(&scraped, ctype, &api_key)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;

    Ok(Json(GenerateResponse {
        success: true,
        content,
    }))
}