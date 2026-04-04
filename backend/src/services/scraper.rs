use reqwest::Client;
use scraper::{Html, Selector};

pub async fn scrape_url(url: &str) -> Result<String, String> {
    let client = Client::builder()
        .user_agent("Mozilla/5.0 (compatible; SolanaContentBot/1.0)")
        .build()
        .map_err(|e| e.to_string())?;

    // Fetch the raw HTML
    let html = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch URL: {}", e))?
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    let document = Html::parse_document(&html);

    // Remove script and style tags — we only want readable text
    let mut text_parts: Vec<String> = Vec::new();

    let selectors = ["p", "h1", "h2", "h3", "h4", "li", "article", "section"];

    for selector_str in &selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            for element in document.select(&selector) {
                let text = element.text().collect::<Vec<_>>().join(" ");
                let clean = text.trim().to_string();
                if !clean.is_empty() && clean.len() > 20 {
                    text_parts.push(clean);
                }
            }
        }
    }

    if text_parts.is_empty() {
        return Err("Could not extract text from URL".to_string());
    }

    // Cap at ~3000 chars so we don't blow Gemini's context
    let combined = text_parts.join("\n");
    let truncated = combined.chars().take(3000).collect::<String>();

    Ok(truncated)
}