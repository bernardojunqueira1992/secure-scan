ALTER TABLE findings DROP CONSTRAINT findings_severity_check;
ALTER TABLE findings ADD CONSTRAINT findings_severity_check 
  CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));