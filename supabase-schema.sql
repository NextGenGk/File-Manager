-- Create users table 
 CREATE TABLE users ( 
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
     clerk_id TEXT UNIQUE NOT NULL, 
     email TEXT UNIQUE NOT NULL, 
     first_name TEXT, 
     last_name TEXT, 
     image_url TEXT, 
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), 
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), 
     storage_quota BIGINT DEFAULT 2147483648, -- 2GB in bytes 
     storage_used BIGINT DEFAULT 0, 
     bucket_prefix TEXT UNIQUE NOT NULL 
 ); 
 
 -- Create user_folders table 
 CREATE TABLE user_folders ( 
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
     folder_name TEXT NOT NULL, 
     s3_prefix TEXT NOT NULL, 
     parent_id UUID REFERENCES user_folders(id) ON DELETE CASCADE, 
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), 
     UNIQUE(user_id, s3_prefix) 
 ); 
 
 -- Create user_files table 
 CREATE TABLE user_files ( 
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
     s3_key TEXT NOT NULL, 
     file_name TEXT NOT NULL, 
     file_size BIGINT NOT NULL, 
     content_type TEXT, 
     uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), 
     last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(), 
     folder_id UUID REFERENCES user_folders(id) ON DELETE CASCADE, 
     UNIQUE(user_id, s3_key) 
 ); 
 
 -- Create API keys table 
 CREATE TABLE api_keys ( 
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
     key_name TEXT NOT NULL, 
     api_key TEXT UNIQUE NOT NULL, 
     api_key_hash TEXT NOT NULL, -- Store hashed version for security 
     permissions TEXT[] DEFAULT ARRAY['read'], -- 'read', 'write', 'delete' 
     is_active BOOLEAN DEFAULT true, 
     last_used TIMESTAMP WITH TIME ZONE, 
     expires_at TIMESTAMP WITH TIME ZONE, 
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), 
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), 
     UNIQUE(user_id, key_name) 
 ); 
 
 -- Create indexes for better performance 
 CREATE INDEX idx_users_clerk_id ON users(clerk_id); 
 CREATE INDEX idx_user_files_user_id ON user_files(user_id); 
 CREATE INDEX idx_user_files_s3_key ON user_files(s3_key); 
 CREATE INDEX idx_user_folders_user_id ON user_folders(user_id); 
 CREATE INDEX idx_user_folders_parent_id ON user_folders(parent_id); 
 
 -- Create indexes for API keys 
 CREATE INDEX idx_api_keys_user_id ON api_keys(user_id); 
 CREATE INDEX idx_api_keys_api_key ON api_keys(api_key); 
 CREATE INDEX idx_api_keys_is_active ON api_keys(is_active); 
 
 -- Create function to automatically update updated_at 
 CREATE OR REPLACE FUNCTION update_updated_at_column() 
 RETURNS TRIGGER AS $$ 
 BEGIN 
     NEW.updated_at = NOW(); 
     RETURN NEW; 
 END; 
 $$ language 'plpgsql'; 
 
 -- Create trigger for users table 
 CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
 
 -- Create trigger for API keys table 
 CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys 
     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
 
 -- DISABLE Row Level Security for now (we'll handle security at the application level) 
 -- Since we're using API routes with proper authentication, we don't need RLS 
 -- ALTER TABLE users ENABLE ROW LEVEL SECURITY; 
 -- ALTER TABLE user_files ENABLE ROW LEVEL SECURITY; 
 -- ALTER TABLE user_folders ENABLE ROW LEVEL SECURITY; 
 
 -- Note: RLS policies commented out - we handle security in our API routes 
 -- This allows our authenticated API routes to perform CRUD operations 
 -- Security is enforced by checking Clerk authentication in each API route
