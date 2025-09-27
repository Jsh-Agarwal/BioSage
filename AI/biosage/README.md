# BioSage — API-Only Multi‑Agent Diagnostic System

This backend exposes a small HTTP API that orchestrates multiple specialist agents (Infectious, Autoimmune) in parallel, fuses their opinions into a single differential, selects one next‑best diagnostic test using a knowledge graph, and returns actionable recommendations. It also persists evidence for later review.

---

## 0) High‑Level Architecture

Data flow for a request to `POST /diagnose`:

1) Client sends `PatientData` JSON.
2) Orchestrator transforms to internal `Intake`, normalizes symptoms, and builds a shared context.
3) Two specialist agents run concurrently (Infectious, Autoimmune). Each:
   - Retrieves supporting evidence from hybrid literature search (FAISS dense + BM25 sparse) and previous cases.
   - Adds light knowledge‑graph snippets.
   - Calls the reasoning LLM with a structured prompt and outputs strict JSON candidates.
4) Integrator merges candidates into a Top‑5 differential, computes agent disagreement, and chooses a single next‑best test via KG heuristics.
5) Recommendations generator adds 3–6 actionable items.
6) Evidence (inputs, normalized view, agent outputs, fused result, context) is persisted to SQLite under a hashed case ID.

Key subsystems:
- API: `biosage/app/main.py` (FastAPI)
- Orchestrator: `biosage/core/orchestrator.py`
- Transform & Normalize: `biosage/core/transform.py`, `biosage/core/normalize.py`
- Agents: `biosage/agents/infectious.py`, `biosage/agents/autoimmune.py`
- Integration & Test selection: `biosage/agents/integrator.py`, `biosage/core/kg.py`
- Retrieval: `biosage/core/vectorstore.py` (FAISS + BM25), `biosage/core/casebase.py`
- LLM & Redaction: `biosage/core/llm.py`, `biosage/core/redact.py`
- Evidence store: `biosage/core/evidence.py`
- Schemas: `biosage/core/schemas.py`

---

## 1) API Endpoints

### POST /diagnose
- Input: `PatientData` JSON. This mirrors `misc/patient_data.txt` sections: `basic`, `case`, `vitals`, `tests[]`, `medical_history`, `social_history`.
- Output: `DiagnoseResult` JSON with `{ agents, fused, recommendations }`.

Request example (minimal):

```json
{
  "basic": { "mrn": "P123", "gender": "female", "dob": "1990-04-03" },
  "case": { "chief_complaint": "fever, myalgia" },
  "vitals": { "temperature": "38.5", "bp": "120/80", "o2sat": "98" },
  "tests": [ { "test": "WBC", "value": "12.0" } ],
  "medical_history": { "conditions": [ { "condition": "Type 2 diabetes" } ] },
  "social_history": { "travel": "Delhi", "exposure": "mosquitoes" }
}
```

Response example (abridged):

```json
{
  "agents": [
    {
      "agent": "infectious",
      "candidates": [
        {
          "diagnosis": "Dengue fever",
          "rationale": "Classic febrile illness with myalgia...",
          "citations": [ { "doc_id": "PMID:12345", "span": "para 2" } ],
          "graph_paths": [["fever", "suggests_test", "NS1 antigen"]],
          "confidence_qual": "medium"
        }
      ]
    },
    { "agent": "autoimmune", "candidates": [ /* ... */ ] }
  ],
  "fused": {
    "differential": [
      { "diagnosis": "Dengue fever", "score_global": 0.71, "why_top": "..." }
    ],
    "next_best_test": {
      "name": "NS1 antigen",
      "why": "Maximizes discrimination among top hypotheses",
      "linked_hypotheses": ["Dengue fever"],
      "graph_edges": [["Dengue fever", "suggests_test", "NS1 antigen"]]
    },
    "disagreement_score": 0.14,
    "test_plans": [ { "diagnosis": "Dengue fever", "plan": "If NS1 positive → favor Dengue; if negative → re‑evaluate." } ]
  },
  "recommendations": [
    { "title": "Hydration and antipyretics", "rationale": "Supportive care", "priority": "medium" }
  ]
}
```

### GET /evidence/{case_id}
- Input: `case_id` is your original patient identifier (e.g., MRN). The store hashes this to protect PHI.
- Output: Persisted bundle: `{ intake, normalized, agents, fused, evidence[] }` or `{}` if not found.

Example:

```bash
curl -s http://localhost:8009/evidence/P123 | jq .
```

---

## 2) Schemas (Key Models)

- `PatientData` → transformed into `Intake` with parsed demographics, vitals (`temp_c`, `bp_sys/dia`, `spo2`), narrative, exposures, initial labs.
- `AgentResult` → `{ agent: "infectious" | "autoimmune", candidates: Candidate[] }` with citations and optional graph paths.
- `FusedOutput` → Top‑5 `DifferentialItem[]`, one `NextBestTest`, optional `disagreement_score`, and `test_plans[]`.
- `DiagnoseResult` → `{ agents, fused, recommendations[] }`.

See `biosage/core/schemas.py` for authoritative definitions.

---

## 3) Retrieval & Knowledge Graph

- Literature: `biosage/core/vectorstore.py` loads `biosage/data/literature/corpus.jsonl` and supports hybrid search (`search_hybrid`). Dense uses FAISS over OpenAI embeddings; sparse uses BM25.
- Casebase: `biosage/core/casebase.py` embeds summaries of previous cases stored in SQLite and retrieves nearest neighbors.
- KG: `biosage/core/kg.py` loads entities/relations from SQLite (and writes `storage/kg.graphml`). `suggest_next_best_test` selects a test using fallback vote‑count or information‑gain heuristics.

---

## 4) Providers & Models

- Reasoning model: `OPENAI_REAS_MODEL` (default `gpt-4o`).
- Embedding model: `OPENAI_EMBED_MODEL` (default `text-embedding-3-large`).
- PHI redaction is applied before LLM calls (`biosage/core/redact.py`).

Environment variables can be supplied via Docker Compose (`docker-compose.yml`).

---

## 5) Build & Run

Python (local):
- `pip install -r biosage/requirements.txt`
- Set `OPENAI_API_KEY`
- Build assets:
  - `python -m biosage.scripts.build_kg`
  - `python -m biosage.scripts.build_vectors`
- Start API: `uvicorn biosage.app.main:app --reload`

Docker Compose:
- `docker compose up --build -d`
- (Optional) Build assets inside the running container:
  - `docker compose exec biosage-api python -m biosage.scripts.build_kg`
  - `docker compose exec biosage-api python -m biosage.scripts.build_vectors`

---

## 6) Quick Testing

Send a basic diagnosis request:

```bash
curl -s -X POST http://localhost:8009/diagnose \
  -H 'Content-Type: application/json' \
  -d '{
    "basic": { "mrn": "P123", "gender": "female", "dob": "1990-04-03" },
    "case": { "chief_complaint": "fever, myalgia" },
    "vitals": { "temperature": "38.5", "bp": "120/80", "o2sat": "98" }
  }' | jq .
```

Fetch persisted evidence:

```bash
curl -s http://localhost:8009/evidence/P123 | jq .
```

---

## 7) Notes & Guarantees

- Agents attempt to always return structured candidates; pipeline degrades gracefully if an agent fails (empty set rather than error).
- Evidence store hashes `case_id` keys for privacy; prompts are PHI‑redacted.
- Vector loader skips blank/malformed JSONL lines for robustness.

Posting to http://localhost:8009/diagnose ...

=== DiagnoseResult (summary) ===
- Agent: infectious | Top: Una virus infection, Tonate virus infection, Uruma virus infection
- Agent: autoimmune | Top: Ntaya virus infection, Uruma virus infection, Wesselsbron virus infection

Top differential:
  - Una virus infection (score=0.5) :: FOR: The patient presents with fever and myalgia, which are consistent with Una virus infection in […
  - Tonate virus infection (score=0.5) :: FOR: Fever and myalgia are consistent with Tonate virus infection in [REDACTED NAME] (tonate_2022_16…
  - Uruma virus infection (score=0.5) :: FOR: Fever and myalgia are consistent with Uruma virus infection, which presents similarly in Okinaw…
  - Ntaya virus infection (score=0.5) :: FOR: Fever and myalgia are consistent with Ntaya virus infection, which presents similarly in Africa…
  - Koutango virus infection (score=0.5) :: FOR: Fever and myalgia are consistent with Koutango virus infection, which presents similarly in Afr…

Next best test:
  - Name: NS1/IgM serology
  - Why: Maximizes information gain for top hypotheses
  - Linked hypotheses: Una virus infection, Tonate virus infection, Uruma virus infection, Ntaya virus infection, Koutango virus infection

Recommendations:
  - Order NS1/IgM serology tests: NS1/IgM serology tests can help differentiate between the suspected viral infections (Una, Tonate, Uruma, Ntaya, and Koutango) by identifying specific viral antigens or antibodies, thus maximizing information gain. (priority=high)
  - Perform RT-PCR testing for specific viruses: RT-PCR testing for Tonate, Ntaya, and Koutango viruses can provide definitive evidence of infection, especially given the lack of travel history which complicates the differential diagnosis. (priority=high)
  - Monitor vital signs and symptom progression: Continuous monitoring of the patient's vital signs and symptoms such as fever and myalgia will help assess the severity and progression of the illness, guiding further management decisions. (priority=medium)
  - Initiate supportive care: Providing supportive care, including hydration and antipyretics, can help manage symptoms like fever and myalgia while awaiting diagnostic results. (priority=medium)
  - Consider infectious disease consultation: An infectious disease specialist can provide expert guidance on further diagnostic testing and management, especially given the rare and geographically diverse nature of the suspected infections. (priority=low)

=== Raw JSON (pretty) ===
```
{
  "agents": [
    {
      "agent": "infectious",
      "candidates": [
        {
          "diagnosis": "Una virus infection",
          "rationale": "FOR: The patient presents with fever and myalgia, which are consistent with Una virus infection in [REDACTED NAME] (una_2022_157). AGAINST: The absence of headache, which is commonly associated with Una virus, is a negative finding (una_2022_157). DISCRIMINATOR: RT-PCR for Una virus would confirm the diagnosis. COMPARE: Unlike Tonate virus, which also presents in [REDACTED NAME], Una virus does not require headache as a mandatory symptom, making it a better fit for this presentation.",
          "citations": [
            {
              "doc_id": "una_2022_157",
              "span": "Una virus presents with fever, headache, and myalgia in [REDACTED NAME]."
            }
          ],
          "graph_paths": [
            [
              "Una virus",
              "symptoms",
              "fever"
            ],
            [
              "Una virus",
              "symptoms",
              "myalgia"
            ]
          ],
          "confidence_qual": "medium",
          "score_local": null
        },
        {
          "diagnosis": "Tonate virus infection",
          "rationale": "FOR: Fever and myalgia are consistent with Tonate virus infection in [REDACTED NAME] (tonate_2022_163). AGAINST: The absence of headache, a common symptom, is a negative finding (tonate_2022_163). DISCRIMINATOR: RT-PCR for Tonate virus would confirm the diagnosis. COMPARE: Unlike Ntaya virus, which is not known to occur in [REDACTED NAME], Tonate virus is endemic, making it more plausible.",
          "citations": [
            {
              "doc_id": "tonate_2022_163",
              "span": "Tonate virus presents with fever, headache, and myalgia in [REDACTED NAME]."
            }
          ],
          "graph_paths": [
            [
              "Tonate virus",
              "symptoms",
              "fever"
            ],
            [
              "Tonate virus",
              "symptoms",
              "myalgia"
            ]
          ],
          "confidence_qual": "medium",
          "score_local": null
        },
        {
          "diagnosis": "Uruma virus infection",
          "rationale": "FOR: Fever and myalgia are consistent with Uruma virus infection, which presents similarly in Okinawa (uruma_2022_169). AGAINST: The patient has no travel history to Okinawa, which is a significant negative finding (uruma_2022_169). DISCRIMINATOR: RT-PCR for Uruma virus would confirm the diagnosis. COMPARE: Unlike Wesselsbron virus, which is geographically limited to Africa, Uruma virus could be considered if there were travel history, but lacks such evidence here.",
          "citations": [
            {
              "doc_id": "uruma_2022_169",
              "span": "Uruma virus presents with fever, headache, and myalgia in Okinawa."
            }
          ],
          "graph_paths": [
            [
              "Uruma virus",
              "symptoms",
              "fever"
            ],
            [
              "Uruma virus",
              "symptoms",
              "myalgia"
            ]
          ],
          "confidence_qual": "low",
          "score_local": null
        },
        {
          "diagnosis": "Ntaya virus infection",
          "rationale": "FOR: Fever and myalgia are consistent with Ntaya virus infection, which presents similarly in Africa (ntaya_2022_181). AGAINST: The absence of travel to Africa is a significant negative finding (ntaya_2022_181). DISCRIMINATOR: RT-PCR for Ntaya virus would confirm the diagnosis. COMPARE: Unlike Koutango virus, which also requires African exposure, Ntaya virus is considered due to symptom overlap, but lacks geographic plausibility.",   
          "citations": [
            {
              "doc_id": "ntaya_2022_181",
              "span": "Ntaya virus presents with fever, headache, and myalgia in Africa."
            }
          ],
          "graph_paths": [
            [
              "Ntaya virus",
              "symptoms",
              "fever"
            ],
            [
              "Ntaya virus",
              "symptoms",
              "myalgia"
            ]
          ],
          "confidence_qual": "low",
          "score_local": null
        },
        {
          "diagnosis": "Koutango virus infection",
          "rationale": "FOR: Fever and myalgia are consistent with Koutango virus infection, which presents similarly in Africa (koutango_2021_185). AGAINST: The absence of travel to Africa is a significant negative finding (koutango_2021_185). DISCRIMINATOR: RT-PCR for Koutango virus would confirm the diagnosis. COMPARE: Unlike Entebbe bat virus, which requires bat exposure, Koutango virus is considered due to symptom overlap, but lacks geographic plausibility.",
          "citations": [
            {
              "doc_id": "koutango_2021_185",
              "span": "Koutango virus presents with fever, headache, and myalgia in Africa."
            }
          ],
          "graph_paths": [
            [
              "Koutango virus",
              "symptoms",
              "fever"
            ],
            [
              "Koutango virus",
              "symptoms",
              "myalgia"
            ]
          ],
          "confidence_qual": "low",
          "score_local": null
        }
      ]
    },
    {
      "agent": "autoimmune",
      "candidates": [
        {
          "diagnosis": "Ntaya virus infection",
          "rationale": "FOR: The patient presents with fever and myalgia, which are consistent with Ntaya virus infection (ntaya_2022_181). AGAINST: There is no mention of headache, which is commonly associated with Ntaya virus. DISCRIMINATOR: Perform RT-PCR for Ntaya virus to confirm the diagnosis. COMPARE: This diagnosis is preferable to Koutango virus infection as there is no travel history to Africa, where Koutango is endemic.",
          "citations": [
            {
              "doc_id": "ntaya_2022_181",
              "span": "Ntaya virus presents with fever, headache, and myalgia in Africa."
            }
          ],
          "graph_paths": [
            [
              "default",
              "path"
            ]
          ],
          "confidence_qual": "medium",
          "score_local": null
        },
        {
          "diagnosis": "Uruma virus infection",
          "rationale": "FOR: Fever and myalgia are consistent with Uruma virus infection, which is endemic to Okinawa (uruma_2022_169). AGAINST: There is no travel history to Okinawa, which decreases the likelihood. DISCRIMINATOR: RT-PCR for Uruma virus would confirm the diagnosis. COMPARE: This is less likely than Ntaya virus due to lack of travel history to endemic regions.",     
          "citations": [
            {
              "doc_id": "uruma_2022_169",
              "span": "Uruma virus presents with fever, headache, and myalgia in Okinawa."
            }
          ],
          "graph_paths": [
            [
              "default",
              "path"
            ]
          ],
          "confidence_qual": "low",
          "score_local": null
        },
        {
          "diagnosis": "Wesselsbron virus infection",
          "rationale": "FOR: Fever and myalgia fit the presentation of Wesselsbron virus (wesselsbron_2020_177). AGAINST: Absence of headache and travel to Africa makes this less likely. DISCRIMINATOR: RT-PCR for Wesselsbron virus would confirm the diagnosis. COMPARE: Less likely than Ntaya virus due to similar geographic constraints.",
          "citations": [
            {
              "doc_id": "wesselsbron_2020_177",
              "span": "Wesselsbron virus presents with fever, headache, and myalgia in Africa."
            }
          ],
          "graph_paths": [
            [
              "default",
              "path"
            ]
          ],
          "confidence_qual": "low",
          "score_local": null
        },
        {
          "diagnosis": "Koutango virus infection",
          "rationale": "FOR: Fever and myalgia are consistent with Koutango virus infection (koutango_2021_185). AGAINST: No travel to Africa, where Koutango is endemic, and absence of headache. DISCRIMINATOR: RT-PCR for Koutango virus would confirm the diagnosis. COMPARE: Less likely than Ntaya virus due to geographic distribution.",
          "citations": [
            {
              "doc_id": "koutango_2021_185",
              "span": "Koutango virus presents with fever, headache, and myalgia in Africa."
            }
          ],
          "graph_paths": [
            [
              "default",
              "path"
            ]
          ],
          "confidence_qual": "low",
          "score_local": null
        },
        {
          "diagnosis": "Una virus infection",
          "rationale": "FOR: Fever and myalgia are consistent with Una virus infection (una_2022_157). AGAINST: Lack of specific geographic exposure reduces likelihood. DISCRIMINATOR: RT-PCR for Una virus would confirm the diagnosis. COMPARE: Less specific geographic information makes it less likely than Ntaya virus.",
          "citations": [
            {
              "doc_id": "una_2022_157",
              "span": "Una virus presents with fever, headache, and myalgia in [REDACTED NAME]."
            }
          ],
          "graph_paths": [
            [
              "default",
              "path"
            ]
          ],
          "confidence_qual": "low",
          "score_local": null
        },
        {
          "diagnosis": "Tonate virus infection",
          "rationale": "FOR: Fever and myalgia fit the presentation of Tonate virus (tonate_2022_163). AGAINST: No specific geographic exposure mentioned. DISCRIMINATOR: RT-PCR for Tonate virus would confirm the diagnosis. COMPARE: Less likely than Ntaya virus due to lack of specific geographic exposure.", 
          "citations": [
            {
              "doc_id": "tonate_2022_163",
              "span": "Tonate virus presents with fever, headache, and myalgia in [REDACTED NAME]."
            }
          ],
          "graph_paths": [
            [
              "default",
              "path"
            ]
          ],
          "confidence_qual": "low",
          "score_local": null
        }
      ]
    }
  ],
  "fused": {
    "differential": [
      {
        "diagnosis": "Una virus infection",
        "score_global": 0.5,
        "why_top": "FOR: The patient presents with fever and myalgia, which are consistent with Una virus infection in [REDACTED NAME] (una_2022_157). AGAINST: The absence of headache, which is commonly associated with Una virus, is a negative finding (una_202",
        "citations": [
          {
            "doc_id": "una_2022_157",
            "span": "Una virus presents with fever, headache, and myalgia in [REDACTED NAME]."
          },
          {
            "doc_id": "una_2022_157",
            "span": "Una virus presents with fever, headache, and myalgia in [REDACTED NAME]."
          }
        ],
        "graph_paths": [
          [
            "Una virus",
            "symptoms",
            "fever"
          ],
          [
            "Una virus",
            "symptoms",
            "myalgia"
          ],
          [
            "default",
            "path"
          ]
        ]
      },
      {
        "diagnosis": "Tonate virus infection",
        "score_global": 0.5,
        "why_top": "FOR: Fever and myalgia are consistent with Tonate virus infection in [REDACTED NAME] (tonate_2022_163). AGAINST: The absence of headache, a common symptom, is a negative finding (tonate_2022_163). DISCRIMINATOR: RT-PCR for Tonate virus woul",
        "citations": [
          {
            "doc_id": "tonate_2022_163",
            "span": "Tonate virus presents with fever, headache, and myalgia in [REDACTED NAME]."
          },
          {
            "doc_id": "tonate_2022_163",
            "span": "Tonate virus presents with fever, headache, and myalgia in [REDACTED NAME]."
          }
        ],
        "graph_paths": [
          [
            "Tonate virus",
            "symptoms",
            "fever"
          ],
          [
            "Tonate virus",
            "symptoms",
            "myalgia"
          ],
          [
            "default",
            "path"
          ]
        ]
      },
      {
        "diagnosis": "Uruma virus infection",
        "score_global": 0.5,
        "why_top": "FOR: Fever and myalgia are consistent with Uruma virus infection, which presents similarly in Okinawa (uruma_2022_169). AGAINST: The patient has no travel history to Okinawa, which is a significant negative finding (uruma_2022_169). DISCRIM",
        "citations": [
          {
            "doc_id": "uruma_2022_169",
            "span": "Uruma virus presents with fever, headache, and myalgia in Okinawa."
          },
          {
            "doc_id": "uruma_2022_169",
            "span": "Uruma virus presents with fever, headache, and myalgia in Okinawa."
          }
        ],
        "graph_paths": [
          [
            "Uruma virus",
            "symptoms",
            "fever"
          ],
          [
            "Uruma virus",
            "symptoms",
            "myalgia"
          ],
          [
            "default",
            "path"
          ]
        ]
      },
      {
        "diagnosis": "Ntaya virus infection",
        "score_global": 0.5,
        "why_top": "FOR: Fever and myalgia are consistent with Ntaya virus infection, which presents similarly in Africa (ntaya_2022_181). AGAINST: The absence of travel to Africa is a significant negative finding (ntaya_2022_181). DISCRIMINATOR: RT-PCR for Nt",
        "citations": [
          {
            "doc_id": "ntaya_2022_181",
            "span": "Ntaya virus presents with fever, headache, and myalgia in Africa."
          },
          {
            "doc_id": "ntaya_2022_181",
            "span": "Ntaya virus presents with fever, headache, and myalgia in Africa."
          }
        ],
        "graph_paths": [
          [
            "Ntaya virus",
            "symptoms",
            "fever"
          ],
          [
            "Ntaya virus",
            "symptoms",
            "myalgia"
          ],
          [
            "default",
            "path"
          ]
        ]
      },
      {
        "diagnosis": "Koutango virus infection",
        "score_global": 0.5,
        "why_top": "FOR: Fever and myalgia are consistent with Koutango virus infection, which presents similarly in Africa (koutango_2021_185). AGAINST: The absence of travel to Africa is a significant negative finding (koutango_2021_185). DISCRIMINATOR: RT-P",
        "citations": [
          {
            "doc_id": "koutango_2021_185",
            "span": "Koutango virus presents with fever, headache, and myalgia in Africa."
          },
          {
            "doc_id": "koutango_2021_185",
            "span": "Koutango virus presents with fever, headache, and myalgia in Africa."
          }
        ],
        "graph_paths": [
          [
            "Koutango virus",
            "symptoms",
            "fever"
          ],
          [
            "Koutango virus",
            "symptoms",
            "myalgia"
          ],
          [
            "default",
            "path"
          ]
        ]
      }
    ],
    "next_best_test": {
      "name": "NS1/IgM serology",
      "why": "Maximizes information gain for top hypotheses",
      "linked_hypotheses": [
        "Una virus infection",
        "Tonate virus infection",
        "Uruma virus infection",
        "Ntaya virus infection",
        "Koutango virus infection"
      ],
      "graph_edges": [
        [
          "Una virus infection",
          "suggests_test",
          "NS1/IgM serology"
        ],
        [
          "Tonate virus infection",
          "suggests_test",
          "NS1/IgM serology"
        ],
        [
          "Uruma virus infection",
          "suggests_test",
          "NS1/IgM serology"
        ],
        [
          "Ntaya virus infection",
          "suggests_test",
          "NS1/IgM serology"
        ],
        [
          "Koutango virus infection",
          "suggests_test",
          "NS1/IgM serology"
        ]
      ]
    },
    "disagreement_score": 0.0615553786230083,
    "test_plans": [
      {
        "diagnosis": "Una virus infection",
        "plan": "If NS1/IgM serology positive → favor Una virus infection; if negative → order clinical re-evaluation."
      },
      {
        "diagnosis": "Tonate virus infection",
        "plan": "If NS1/IgM serology positive → favor Tonate virus infection; if negative → order clinical re-evaluation."
      },
      {
        "diagnosis": "Uruma virus infection",
        "plan": "If NS1/IgM serology positive → favor Uruma virus infection; if negative → order clinical re-evaluation."
      }
    ]
  },
  "recommendations": [
    {
      "title": "Order NS1/IgM serology tests",
      "rationale": "NS1/IgM serology tests can help differentiate between the suspected viral infections (Una, Tonate, Uruma, Ntaya, and Koutango) by identifying specific viral antigens or antibodies, thus maximizing information gain.",
      "priority": "high"
    },
    {
      "title": "Perform RT-PCR testing for specific viruses",
      "rationale": "RT-PCR testing for Tonate, Ntaya, and Koutango viruses can provide definitive evidence of infection, especially given the lack of travel history which complicates the differential diagnosis.",
      "priority": "high"
    },
    {
      "title": "Monitor vital signs and symptom progression",
      "rationale": "Continuous monitoring of the patient's vital signs and symptoms such as fever and myalgia will help assess the severity and progression of the illness, guiding further management decisions.",
      "priority": "medium"
    },
    {
      "title": "Initiate supportive care",
      "rationale": "Providing supportive care, including hydration and antipyretics, can help manage symptoms like fever and myalgia while awaiting diagnostic results.",
      "priority": "medium"
    },
    {
      "title": "Consider infectious disease consultation",
      "rationale": "An infectious disease specialist can provide expert guidance on further diagnostic testing and management, especially given the rare and geographically diverse nature of the suspected infections.",
      "priority": "low"
    }
  ]
}
```