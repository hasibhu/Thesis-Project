# Signal Detection Theory Analysis for Pilot Data
# This script computes Hit Rate, False Alarm Rate, and d' for each difficulty level


#//write_csv(hit_miss_by_gap, "forDalit.csv")

# Step 1: Load and combine all participant data files
# Only select columns we need (some files have different structures)
needed_cols <- c("ID", "gapOf", "decision_choice", "signal_detection")

data_files <- list.files(path = "dataFiles", pattern = "*.csv", full.names = TRUE)

# Read each file and select only needed columns
all_data_list <- lapply(data_files, function(f) {
  df <- read.csv(f)
  # Select only columns that exist
  cols_to_use <- intersect(needed_cols, names(df))
  return(df[, cols_to_use, drop = FALSE])
})

all_data <- do.call(rbind, all_data_list)

cat("Total number of trials:", nrow(all_data), "\n")
cat("Number of participants:", length(unique(all_data$ID)), "\n\n")

# Step 2: Calculate False Alarm Rate (FA) for identical pairs (gapOf = 0)
# FA = "Different" responses to identical pairs / total identical pairs
identical_trials <- all_data[all_data$gapOf == 0, ]
total_identical <- nrow(identical_trials)
different_responses_to_identical <- sum(identical_trials$decision_choice == "Different")

FA <- different_responses_to_identical / total_identical

cat("=== FALSE ALARM (FA) Calculation ===\n")
cat("Total identical trials (gapOf = 0):", total_identical, "\n")
cat("'Different' responses to identical:", different_responses_to_identical, "\n")
cat("FA rate:", round(FA, 4), "\n\n")

# Step 3: Calculate Hit Rate for each difficulty level (gapOf 1-11)
# Hit = "Different" responses to actually different pairs / total different pairs at each level
# Apply correction for extreme values (log-linear correction: use 1-1/(2N) for hit rate of 1)
cat("=== HIT RATE Calculation by Difficulty Level ===\n")

results <- data.frame(
  difficulty_level = 1:11,
  total_trials = NA,
  hits = NA,
  hit_rate = NA,
  hit_rate_corrected = NA,
  z_hit = NA,
  z_fa = NA,
  d_prime = NA
)

# Calculate z(FA) - same for all levels (with correction if needed)
if (FA == 0) {
  z_FA <- qnorm(1 - 1/(2 * total_identical))
} else if (FA == 1) {
  z_FA <- qnorm(1/(2 * total_identical))
} else {
  z_FA <- qnorm(FA)
}
cat("z(FA):", round(z_FA, 4), "\n\n")

# Calculate Hit Rate for each difficulty level
for (level in 1:11) {
  # Get all trials where gapOf == level (actually different pairs)
  different_trials <- all_data[all_data$gapOf == level, ]
  total_different <- nrow(different_trials)
  
  # Count "Different" responses (hits)
  hits <- sum(different_trials$decision_choice == "Different")
  
  # Calculate Hit Rate
  Hk <- hits / total_different
  
  # Apply log-linear correction for extreme values
  if (Hk == 1) {
    Hk_corrected <- 1 - 1/(2 * total_different)
  } else if (Hk == 0) {
    Hk_corrected <- 1/(2 * total_different)
  } else {
    Hk_corrected <- Hk
  }
  
  # Store results
  results$total_trials[level] <- total_different
  results$hits[level] <- hits
  results$hit_rate[level] <- Hk
  results$hit_rate_corrected[level] <- Hk_corrected
  results$z_hit[level] <- qnorm(Hk_corrected)
  results$z_fa[level] <- z_FA
  
  # Calculate d' = z(Hit) - z(FA)
  d_prime <- qnorm(Hk_corrected) - z_FA
  results$d_prime[level] <- d_prime
  
  cat(sprintf("Level %2d: Total trials = %3d, Hits = %2d, Hit Rate = %.4f, d' = %.4f\n", 
              level, total_different, hits, Hk, d_prime))
}

# Step 4: Display final results table
cat("\n=== FINAL RESULTS TABLE ===\n")
cat("Difficulty Level | Total Trials | Hits | Hit Rate | z(Hit)  | z(FA)   | d'\n")
cat("-----------------|--------------|------|----------|----------|----------|--------\n")
for (level in 1:11) {
  cat(sprintf("%16d | %12d | %4d | %8.4f | %8.4f | %8.4f | %6.4f\n",
              level, 
              results$total_trials[level],
              results$hits[level],
              results$hit_rate[level], 
              results$z_hit[level], 
              results$z_fa[level], 
              results$d_prime[level]))
}

# Step 5: Save results to CSV
write.csv(results, "sdt_results.csv", row.names = FALSE)
cat("\nResults saved to: sdt_results.csv\n")

# Step 6: Interpretation
cat("\n=== INTERPRETATION ===\n")
cat("1. Does hit rate increase with difficulty level?\n")
cat("   ", ifelse(all(diff(results$hit_rate) >= 0), "Yes, generally increases", "No, not monotonic"), "\n\n")

# Check for ceiling/floor effects
extreme_levels <- results$hit_rate[results$hit_rate > 0.9 | results$hit_rate < 0.1]
if (length(extreme_levels) > 0) {
  cat("2. Extreme performance (ceiling/floor) detected at levels:\n")
  cat("   ", which(results$hit_rate > 0.9 | results$hit_rate < 0.1), "\n\n")
}

# Identify middle levels with useful information
middle_levels <- results$hit_rate[results$hit_rate > 0.1 & results$hit_rate < 0.9]
if (length(middle_levels) > 0) {
  cat("3. Levels with non-extreme performance (most informative):\n")
  cat("   ", which(results$hit_rate > 0.1 & results$hit_rate < 0.9), "\n")
  cat("   These levels provide the most useful information for measuring sensitivity.\n")
}
