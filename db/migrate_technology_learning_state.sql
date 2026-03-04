USE inkflow;

-- Normalize legacy workflow states into the new learning-state model.
UPDATE technology_insights
SET status = 'Learned'
WHERE status IN ('Collected', 'Analyzed', 'Drafted');

-- Enforce the new two-state enum.
ALTER TABLE technology_insights
MODIFY COLUMN status ENUM('Learned', 'To Learn') NOT NULL DEFAULT 'To Learn';
