use reqwest::Client;
use serde_json::{json, Value};

pub enum ContentType {
    Thread,
    Article,
}

pub async fn generate_content(
    text: &str,
    content_type: ContentType,
    api_key: &str,
) -> Result<String, String> {
    let prompt = match content_type {
        ContentType::Thread => format!(
            "You are a Web3 content writer. Based on the following article, write an engaging Twitter/X thread with 6-8 tweets. 
            Format each tweet as '1/', '2/', etc. Make it educational, punchy, and end with a strong CTA.
            
            Article content:
            {}",
            text
        ),
        ContentType::Article => format!(
            "You are a Web3 content writer. Based on the following content, write a clear, engaging 300-word article summary 
            suitable for a newsletter. Use simple language, no jargon.
            
            Content:
            {}",
            text
        ),
    };

    let client = Client::new();

    let body = json!({
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1024
        }
    });

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={}",
        api_key
    );

    let response = client
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Gemini request failed: {}", e))?;

    let json: Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse Gemini response: {}", e))?;

    // Extract the text from Gemini's nested response structure
    let content = json["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .ok_or("No content in Gemini response")?
        .to_string();

    Ok(content)
}