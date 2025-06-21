#!/usr/bin/env python3
"""
Fine-tunes Gemma-3-4B with Unsloth LoRA adapters.
Task: extract de-contextualized propositions from entity records.
"""

from __future__ import annotations
import json, torch
from datasets import Dataset
from unsloth import FastLanguageModel
from trl import SFTTrainer, SFTConfig


# ──────────────────────────  Model  ──────────────────────────
def load_model(
    *,
    max_seq_length: int = 4096,
    dtype: torch.dtype | None = None,
    load_in_4bit: bool = True,
):
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name="unsloth/gemma-3-4b-it-unsloth-bnb-4bit",
        max_seq_length=max_seq_length,
        dtype=dtype,
        load_in_4bit=load_in_4bit,
    )

    model = FastLanguageModel.get_peft_model(
        model,
        finetune_vision_layers=False,
        finetune_language_layers=True,
        finetune_attention_modules=True,
        finetune_mlp_modules=True,
        r=8,
        lora_alpha=8,
        lora_dropout=0,  # int to satisfy Pyright
        bias="none",
        random_state=3407,
    )
    return model, tokenizer


# ───────────────────────────  Data  ───────────────────────────
def load_training_data(
    path: str = "processed/unsloth_training_data.json",
) -> list[dict]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def format_for_chat(batch: dict) -> dict:
    texts: list[str] = []
    for inst, inp, out in zip(
        batch["instruction"], batch["input"], batch["output"], strict=True
    ):
        prompt = (
            "<start_of_turn>user\n"
            f"{inst}\n\n{inp}<end_of_turn>\n"
            "<start_of_turn>model\n"
            f"{out}<end_of_turn>"
        )
        texts.append(prompt)
    return {"text": texts}


def build_dataset(data: list[dict]) -> Dataset:
    ds = Dataset.from_list(data)
    return ds.map(format_for_chat, batched=True, remove_columns=ds.column_names)


# ────────────────────────  Trainer  ───────────────────────────
def make_trainer(model, tokenizer, dataset: Dataset) -> SFTTrainer:
    cfg = SFTConfig(
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        warmup_steps=5,
        max_steps=30,
        learning_rate=2e-4,
        logging_steps=1,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="linear",
        seed=3407,
        output_dir="checkpoints",
    )

    return SFTTrainer(
        model=model,
        args=cfg,
        train_dataset=dataset,
        processing_class=tokenizer,  # TRL ≥ 0.16
    )


# ───────────────────────  Quick smoke test  ───────────────────
def smoke_test(model, tokenizer):
    instr = (
        "Extract meaningful, de-contextualized propositions from this entity data. "
        "Use full nouns, no pronouns, always include the person's name."
    )
    entity = (
        "Entity Information:\n"
        "Name: John Smith\n"
        "Summary: Senior Data Scientist at AI Corp\n"
        "Long Summary: John has 5 years of experience in machine learning and data analysis.\n"
        "Research: Met at AI conference 2023\n"
        "Location: Boston, MA"
    )
    prompt = (
        "<start_of_turn>user\n"
        f"{instr}\n\n{entity}<end_of_turn>\n"
        "<start_of_turn>model\n"
    )
    inputs = tokenizer([prompt], return_tensors="pt").to(model.device)
    with torch.no_grad():
        out = model.generate(
            **inputs,
            max_new_tokens=256,
            temperature=0.7,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
        )
    answer = tokenizer.decode(out[0], skip_special_tokens=True)
    print(
        "\n--- Smoke test output ---\n",
        answer.split("<start_of_turn>model\n")[-1].split("<end_of_turn>")[0].strip(),
    )


# ───────────────────────────  Main  ───────────────────────────
def main():
    data = load_training_data()
    dataset = build_dataset(data)

    model, tokenizer = load_model()
    trainer = make_trainer(model, tokenizer, dataset)

    print("Starting fine-tuning…")
    stats = trainer.train()
    print(f"Loss {stats.training_loss:.4f} at step {stats.global_step}")

    smoke_test(model, tokenizer)

    print("Saving adapters…")
    model.save_pretrained("lora_model")
    tokenizer.save_pretrained("lora_model")


if __name__ == "__main__":
    main()
