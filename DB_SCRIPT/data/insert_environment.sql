/* Insert default environment variables for email configuration */

INSERT INTO tbl_Environment (EnvKey, EnvValue) VALUES ('EMAIL_USER', 'default_user@example.com') ON DUPLICATE KEY UPDATE EnvValue = 'default_user@example.com';

INSERT INTO tbl_Environment (EnvKey, EnvValue) VALUES ('EMAIL_PASS', 'default_password') ON DUPLICATE KEY UPDATE EnvValue = 'default_password';
