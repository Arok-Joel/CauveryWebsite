-- Update employees with correct hierarchy levels based on their roles
UPDATE "Employee"
SET "hierarchyLevel" = 
    CASE "employeeRole"
        WHEN 'EXECUTIVE_DIRECTOR' THEN 0
        WHEN 'DIRECTOR' THEN 1
        WHEN 'JOINT_DIRECTOR' THEN 2
        WHEN 'FIELD_OFFICER' THEN 3
        ELSE 0 -- Default to highest level if for some reason the role is not recognized
    END; 