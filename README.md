# Who verifies the benchmark? — Results website

A standalone static results website for the Jev/Decider benchmark-verification study.

## View locally

Open `index.html` in a browser. No build process, dependencies, API keys, or external JavaScript libraries are required.

## Publish with GitHub Pages

1. Create a GitHub repository, e.g. `benchmark-verification-results`.
2. Upload **all files and folders** from this directory to the repository root (including `.nojekyll`). Do not upload the earlier experiment ZIP.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select `main` and `/(root)` as the source, then save.
6. Once GitHub finishes publishing, the site appears at `https://<username>.github.io/benchmark-verification-results/` (replace `<username>` and repository name with yours).

Official guide: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Files

- `index.html` — content, methodology, context, source links.
- `assets/styles.css` — styles, including responsive mobile layouts.
- `assets/app.js` — AUROC comparison controls, review-budget chart, and cost comparisons.
- `data/results.js` — aggregated data for the charts, precompiled for `file://` use.
- `data/results.json` — equivalent JSON source.
- `data/*.csv` — selected aggregate metrics extracted from the study's v2 analysis.

The website does **not** include raw API responses, credentials, full MMLU question texts, original SWE-bench task contents, or the experiment's private execution logs.

## Result definitions and limitations

- MMLU-Redux: 995 sampled items (338 defective, 657 valid), stratified across 57 subjects and weighted to a 5,668-item usable population.
- SWE-bench: 300 engineer-annotated tasks, 150 kept / 150 excluded, with source-population weights.
- AUROC: population-weighted area under the receiver operating characteristic curve (0.5 is random ranking).
- Review-budget chart: weighted-population fraction reviewed against the fraction of known defects selected for review. It assumes perfect detection *after selection*; real human-review time and accuracy were not measured.
- Costs are provider-reported API inference charges for the recorded requests; outputs differ by model and full review-workflow costs are not measured.
- Threshold section uses the designated threshold-evaluation half. The code for the original study's repeated-split statistics contains an uninitialized-mask issue; those numbers are omitted from the website pending correction.
- Neither dataset consists of AI-generated benchmark cases; SWE-bench comparison is agreement with annotations, not executable verification of alternate patches.
- These are exploratory model comparisons; the intervals do not adjust for every multiple comparison.

## Attribution

- MMLU-Redux 2.0: Gema et al., "Are We Done with MMLU?" — https://huggingface.co/datasets/edinburgh-dawg/mmlu-redux-2.0 (CC BY 4.0)
- SWE-bench: Jimenez et al. — https://huggingface.co/datasets/princeton-nlp/SWE-bench
- SWE-bench Verified annotation methodology: OpenAI — https://openai.com/index/introducing-swe-bench-verified/
- FairTask annotation mirror — https://github.com/mnkprs/fairtask
- Meta AutoBenchmark — https://facebookresearch.github.io/RAM/blogs/autobench/
- TypeSafe Jev — https://typesafe.ai/blog/introducing-system-one-models-and-jev

## Updating the site

The charts use aggregated source data from `results/v2/` of the measured study ZIP. Regenerate `results.json` and `results.js` from those CSVs when you rerun the experiment. Keep the displayed text synchronized with new results.
