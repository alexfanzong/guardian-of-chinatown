# The opponent · 1.0 research archive

These results belong to the original 1.0 punching and supply rules. The 2.0 palm guard, pounce and dodge have different match outcomes.

The monster predicts left or right using only earlier punches. It checks the continuation after the same last two moves, then the last move, then the recent overall balance. It remembers up to 32 moves, needs 3 matching examples for a contextual estimate, and smooths the estimate with one starting count for each hand. Probabilities are kept between 5% and 95%.

These are fixed game settings, not a claim of an optimal predictor. Gameplay rules and prediction accuracy are separate: combos, supplies and the time needed to learn affect who wins.

## Recorded simulations

`app/experiment-results.json` contains the original six-strategy simulation: 1,000 sequences per strategy, 80 punches each, with turns 17–80 scored. The frozen model predicted all scored strictly alternating punches and 50.07% of independent fair punches. The original model SHA-256 is `f9cf829f750826af2da19e6282bd600f8973f02bbc6a14b50cdacc80039bcb8d`.

`app/posthoc-results.json` contains separately labelled follow-up calculations. With the full combat rules and tea, the LLRR loop won 2,458 of 4,000 simulated fights (61.45%), all by punch 16. These numbers do not describe the win rate of a person playing the game.

The JSON files and archived explanation component preserve the comparisons, intervals and limitations. The 2.0 fight log shows the predictions and confidence from the current match. This repository includes compact research results, not the full original experiment archive. Changing the model makes those recorded results historical; do not present them as measurements of a changed model.
