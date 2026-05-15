//! Cliente para a API REST Gemini (`generateContent`) — Google AI / AI Studio.
//! Documentação: <https://ai.google.dev/api/rest>

use reqwest::blocking::Client;
use reqwest::header::{HeaderMap, HeaderName, HeaderValue, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use std::time::Duration;

const CONNECT_TIMEOUT: Duration = Duration::from_secs(15);
const READ_TIMEOUT: Duration = Duration::from_secs(120);
const MAX_USER_CHARS: usize = 48_000;

pub const DEFAULT_GEMINI_API_BASE: &str = "https://generativelanguage.googleapis.com/v1beta";
pub const DEFAULT_GEMINI_MODEL: &str = "gemini-flash-latest";

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Part<'a> {
    text: &'a str,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Content<'a> {
    role: &'a str,
    parts: Vec<Part<'a>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SystemInstruction<'a> {
    parts: Vec<Part<'a>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct GenerationConfig {
    temperature: f32,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct GenerateContentRequest<'a> {
    system_instruction: SystemInstruction<'a>,
    contents: Vec<Content<'a>>,
    generation_config: GenerationConfig,
}

#[derive(Deserialize)]
struct GenPart {
    text: Option<String>,
}

#[derive(Deserialize)]
struct GenContent {
    parts: Option<Vec<GenPart>>,
}

#[derive(Deserialize)]
struct Candidate {
    content: Option<GenContent>,
}

#[derive(Deserialize)]
struct GeminiErrorBody {
    message: Option<String>,
    code: Option<i32>,
}

#[derive(Deserialize)]
struct GenerateContentResponse {
    candidates: Option<Vec<Candidate>>,
    error: Option<GeminiErrorBody>,
}

fn normalize_api_base(raw: &str) -> Result<String, String> {
    let t = raw.trim();
    if t.is_empty() {
        return Err("URL base da API Gemini vazia.".to_string());
    }
    let without_slash = t.trim_end_matches('/');
    if !without_slash.starts_with("http://") && !without_slash.starts_with("https://") {
        return Err("URL base deve começar por http:// ou https://.".to_string());
    }
    Ok(without_slash.to_string())
}

fn normalize_model_id(model: &str) -> Result<String, String> {
    let t = model.trim();
    if t.is_empty() {
        return Err("Indique o modelo Gemini (ex.: gemini-2.0-flash).".to_string());
    }
    Ok(t.trim_start_matches("models/").to_string())
}

fn truncate_user_content(text: &str) -> &str {
    if text.len() <= MAX_USER_CHARS {
        return text;
    }
    &text[..MAX_USER_CHARS]
}

/// `api_key` — chave de API do Google AI Studio ou Vertex (conforme a base URL).
pub fn generate_content(
    api_base: &str,
    api_key: &str,
    model: &str,
    system_instruction: &str,
    user_text: &str,
) -> Result<String, String> {
    let key = api_key.trim();
    if key.is_empty() {
        return Err(
            "Chave API Gemini em falta. Configure em Configurações (Google AI Studio)."
                .to_string(),
        );
    }

    let base = normalize_api_base(api_base)?;
    let model_id = normalize_model_id(model)?;
    let user = truncate_user_content(user_text.trim());
    if user.is_empty() {
        return Err("Texto de entrada vazio.".to_string());
    }

    let url = format!(
        "{}/models/{}:generateContent",
        base,
        model_id
    );

    let body = GenerateContentRequest {
        system_instruction: SystemInstruction {
            parts: vec![Part {
                text: system_instruction,
            }],
        },
        contents: vec![Content {
            role: "user",
            parts: vec![Part { text: user }],
        }],
        generation_config: GenerationConfig { temperature: 0.35 },
    };

    let client = Client::builder()
        .connect_timeout(CONNECT_TIMEOUT)
        .timeout(READ_TIMEOUT)
        .build()
        .map_err(|e| format!("Cliente HTTP: {}", e))?;

    let mut headers = HeaderMap::new();
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    // Documentação oficial / curl: `X-goog-api-key` (o parâmetro `?key=` pode falhar em alguns ambientes).
    let key_header = HeaderName::from_static("x-goog-api-key");
    let key_value = HeaderValue::from_str(key).map_err(|_| {
        "Chave API com caracteres inválidos para o cabeçalho HTTP.".to_string()
    })?;
    headers.insert(key_header, key_value);

    let res = client
        .post(&url)
        .headers(headers)
        .json(&body)
        .send()
        .map_err(|e| format!("Falha na rede ao contactar o Gemini: {}", e))?;

    let status = res.status();
    let text = res
        .text()
        .map_err(|e| format!("Resposta ilegível: {}", e))?;

    let parsed: GenerateContentResponse = serde_json::from_str(&text).map_err(|_| {
        if !status.is_success() {
            format!(
                "HTTP {} — {}",
                status,
                text.chars().take(400).collect::<String>()
            )
        } else {
            "Resposta JSON inesperada do Gemini.".to_string()
        }
    })?;

    if let Some(err) = parsed.error {
        let msg = err
            .message
            .unwrap_or_else(|| format!("código {:?}", err.code));
        return Err(format!("Gemini: {}", msg));
    }

    if !status.is_success() {
        return Err(format!(
            "HTTP {} — {}",
            status,
            text.chars().take(400).collect::<String>()
        ));
    }

    let out = parsed
        .candidates
        .as_ref()
        .and_then(|c| c.first())
        .and_then(|cand| cand.content.as_ref())
        .and_then(|c| c.parts.as_ref())
        .and_then(|parts| parts.iter().filter_map(|p| p.text.as_deref()).next())
        .unwrap_or("")
        .trim();

    if out.is_empty() {
        return Err("O Gemini devolveu texto vazio (ver políticas de segurança / conteúdo).".to_string());
    }

    Ok(out.to_string())
}

pub fn system_prompt_corporate(tone: &str) -> String {
    let tone = if tone.trim().is_empty() {
        "formal"
    } else {
        tone.trim()
    };
    format!(
        "É um assistente que escreve em português do Brasil. Transforme resumos técnicos de alterações \
         de software em texto curto para audiência de negócio ou gestão. Tom preferido: {}. \
         Não invente fatos que não constem no texto de entrada. Use 2 a 5 frases objetivas. \
         Devolva apenas o texto final, sem preâmbulo, explicação ou comentário adicional.",
        tone
    )
}

pub fn system_prompt_technical_rewrite(tone: &str) -> String {
    let tone = if tone.trim().is_empty() {
        "formal"
    } else {
        tone.trim()
    };
    format!(
        "É um assistente que redige em português do Brasil relatórios técnicos de homologação ou release a partir apenas do texto de entrada (mensagens de commit, contagens agregadas e lista resumida de arquivos). \
         Tom preferido de escrita: {}.\n\n\
         FORMATAÇÃO (Markdown):\n\
         • Use Markdown de forma sóbria: sem preâmbulo nem cercas de código multilinha salvo indispensável para um excerpt mínimo.\n\
         • Pode usar **negrito** em rótulos curtos de linha (ex.: **Alteração técnica:**, **Objetivo:**) quando isso agrupar o parágrafo seguinte.\n\
         • Regra obrigatória: sempre que referir **caminho de arquivo**, **nome de arquivo**, diretório, prefixo de rota/API (ex.: `/natbackend/`), identificadores técnicos, **nome de método/função**, classe ou comando, envolva com crases de código Markdown (forma `assim`), para destacar como no relatório exemplo (aparência de código/monoespaço em visualizadores Markdown).\n\
         • Não use formato de código Markdown para parágrafos inteiros; mantenha a narrativa em texto corrido ou listas •.\n\n\
         Produza apenas o relatório final (Markdown), sem introdução nem comentários meta.\n\n\
         FORMATO OBRIGATÓRIO (ajuste número e título das secções ao conteúdo disponível; se só houver um tema, pode haver apenas a secção 1 e a última parte fixa):\n\
         • Secções principais numeradas em linhas próprias: \"1.\", \"2.\", \"3.\" … cada uma com um título curto descritivo.\n\
         • Dentro de um tema com vários focos distintos, use subsecções \"2.1\", \"2.2\" … com título, na linha seguinte à numeração.\n\
         • Após cada título ou subsecção, um breve parágrafo quando fizer sentido; use listas com o marcador • para itens pontuais (arquivos, mudanças, práticas mencionadas nas mensagens).\n\
         • Quando o texto-fonte permitir inferências claras, pode usar rótulos de linha própria seguidos de lista, por exemplo \"Benefícios identificados:\", \"Alteração técnica:\", \"Objetivo:\" — apenas com base no que está ou está claramente implícito nos commits ou nomes/paths dos arquivos.\n\
         • Cite apenas caminhos, módulos, APIs ou serviços explicitamente mencionados ou razoavelmente identificáveis a partir desses dados; não invente arquivos, endpoints ou comportamentos não suportados pelo input.\n\
         • Se o input não justificar tema ou bullets, agrupe sob menos secções e seja económico nas listagens.\n\n\
         FECHE obrigatoriamente com uma última secção principal em linha própria: o número inteiro que continua a sequência após a última secção temática, seguido de ponto, espaço e o título \"Análise de impactos\" (ex.: se a última temática foi 3, use a linha \"4. Análise de impactos\").\n\
         Opcionalmente, um parágrafo curto antes dos subtítulos; em seguida, em linhas próprias, exatamente estes subtítulos (sem numeração) e sob cada um uma lista curta em bullets com marcador •, apenas com pontos inferíveis do input; seja conservador quando só houver metadados Git pouco descritivos.\n\
         Impacto funcional\n\
         Impacto técnico\n\
         Compatibilidade e performance\n\n\
         Lembrete: não adicione suposições além das permitidas pelas mensagens de commit e pelos dados de arquivo fornecidos. Devolva só o relatório estruturado.",
        tone
    )
}

#[cfg(test)]
mod tests {
    use super::{normalize_api_base, normalize_model_id};

    #[test]
    fn strips_trailing_slash_on_base() {
        assert_eq!(
            normalize_api_base("https://generativelanguage.googleapis.com/v1beta/")
                .unwrap(),
            "https://generativelanguage.googleapis.com/v1beta"
        );
    }

    #[test]
    fn strips_models_prefix() {
        assert_eq!(
            normalize_model_id("models/gemini-2.0-flash").unwrap(),
            "gemini-2.0-flash"
        );
    }
}
