# Sampling Blueprint

An interactive explainer for how **temperature**, **top-k**, and **top-p** reshape an LLM's next-token distribution before it samples.



**[Live demo →](https://ajithshetty.github.io/llm-sampling-blueprint/)**

[demo image](image.png)


## What it does

Twelve candidate tokens for the prompt `"The weather today is ___"` run through the real decoding pipeline used by Hugging Face `generate()` and AWS Bedrock:

```
logits → ÷ temperature → softmax → top-k filter → top-p filter → renormalize → sample
```

Each bar shows a dim "ghost" (probability after temperature alone) with a bright overlay showing what survives filtering, so you can see exactly what each parameter strips away. Cut tokens are struck through and greyed out.

- **Temperature** — sharpens or flattens the whole distribution
- **Top-K** — hard cutoff at the N most likely tokens
- **Top-P (nucleus)** — cumulative-probability cutoff
- **Presets** — Precise / Balanced / Creative / Chaotic jump to realistic combos
- **Sample button** — actually draws from the final distribution and logs results



## Quickstart

```bash
git clone https://github.com/ajithshetty/llm-sampling-blueprint.git
cd llm-sampling-blueprint
npm install
npm run dev
```

Open `http://localhost:5173`.

### Build & deploy

```bash
npm run build
```



## Tech stack

- React + Vite
- Plain SVG/CSS (no chart library) for full control over the blueprint aesthetic
- No backend — all sampling math runs client-side



## Sources

The sampling logic follows the primary references, not folk knowledge:

- [Hugging Face — generation strategies](https://huggingface.co/docs/transformers/en/generation_strategies) (temperature → top-k → top-p order)
- [Holtzman et al., 2019 — nucleus (top-p) sampling paper](https://arxiv.org/abs/1904.09751)
- [Fan, Lewis & Dauphin, 2018 — top-k sampling paper](https://arxiv.org/abs/1805.04833)
- [AWS Bedrock — inference request parameters reference](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters.html)
- [AWS Bedrock — Claude request/response (temperature, top_p, top_k)](https://docs.aws.amazon.com/bedrock/latest/userguide/model-parameters-anthropic-claude-messages-request-response.html)



## Related

- `[llm-generation-blueprint](https://github.com/ajithshetty/llm-generation-blueprint)` — the companion piece covering repetition penalty, max tokens, and stop sequences (multi-step generation, not a single distribution)



## Built with love from Claude and Cursor

