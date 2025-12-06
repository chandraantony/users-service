-- ==============================================
-- USERS STORED PROCEDURES
-- ==============================================

-- 1. CREATE USER
CREATE OR REPLACE PROCEDURE create_user(
    IN p_full_name TEXT,
    IN p_email TEXT,
    IN p_phone TEXT,
    IN p_address JSONB,
    IN p_role_ids INT[],
    OUT id BIGINT,
    OUT full_name VARCHAR,
    OUT email VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    new_user_id BIGINT;
    new_address_id BIGINT;
    role_count INT;
BEGIN
    -- Validate roles exist
    SELECT COUNT(*) INTO role_count
    FROM roles r
    WHERE r.id = ANY(p_role_ids);

    IF role_count <> array_length(p_role_ids, 1) THEN
        RAISE EXCEPTION 'One or more roles not found';
    END IF;

    -- Insert address
    INSERT INTO addresses(street, city, postal_code) 
    VALUES (
        p_address->>'street',
        p_address->>'city',
        p_address->>'postal_code'
    )
    RETURNING addresses.id INTO new_address_id;

    -- Insert user
    INSERT INTO users(full_name, email, phone, address_id) 
    VALUES (p_full_name, p_email, p_phone, new_address_id)
    RETURNING users.id INTO new_user_id;

    -- Insert roles
    INSERT INTO user_roles(user_id, role_id)
    SELECT new_user_id, unnest(p_role_ids);

    -- Set OUT values
    id := new_user_id;
    full_name := p_full_name;
    email := p_email;

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'A user with this email already exists';
END;
$$;

-- 2. GET USER
CREATE OR REPLACE PROCEDURE get_user(
    IN p_user_id BIGINT,
    IN p_include_address BOOLEAN,
    IN p_include_roles BOOLEAN,
    OUT id BIGINT,
    OUT full_name VARCHAR,
    OUT email VARCHAR,
    OUT phone VARCHAR,
    OUT address JSONB,
    OUT roles JSON
)
LANGUAGE plpgsql
AS $$
BEGIN
    SELECT 
        u.id,
        u.full_name,
        u.email,
        u.phone
    INTO id, full_name, email, phone
    FROM users u
    WHERE u.id = p_user_id AND u.deleted_at IS NULL;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    IF p_include_address THEN
        SELECT row_to_json(ad)::jsonb INTO address
        FROM addresses ad
        WHERE ad.id = p_user_id;
    END IF;

    IF p_include_roles THEN
        SELECT json_agg(r.name) INTO roles
        FROM roles r
        JOIN user_roles ur ON ur.role_id = r.id
        WHERE ur.user_id = p_user_id;
    END IF;
END;
$$;


-- 3. GET USERS
CREATE OR REPLACE PROCEDURE get_users(
    IN p_page INT,
    IN p_limit INT, 
    OUT data JSONB,
    OUT total BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Fetch paginated users
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', u.id,
            'full_name', u.full_name,
            'email', u.email,
            'phone', u.phone,
            'created_at', u.created_at 
        ) ORDER BY u.created_at DESC 
    )
    INTO data
    FROM users u
    WHERE u.deleted_at IS NULL
    OFFSET (p_page - 1) * p_limit
    LIMIT p_limit;

    -- Handle empty result
    IF data IS NULL THEN
        data := '[]'::JSONB;
    END IF;

    -- Total count
    SELECT COUNT(*) INTO total
    FROM users
    WHERE deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE PROCEDURE update_user(
    IN p_user_id INT,
    IN p_full_name TEXT,
    IN p_email TEXT,
    IN p_phone TEXT,
    IN p_address JSONB,
    IN p_role_ids INT[]
)
LANGUAGE plpgsql
AS $$
DECLARE
    new_address_id BIGINT;
    role_count INT;
BEGIN
    -- Check exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Update address
    IF p_address IS NOT NULL THEN

        IF jsonb_typeof(p_address) != 'object' 
           OR NOT (p_address ?& ARRAY['street', 'city', 'postal_code']) THEN
            RAISE EXCEPTION 'Address must be a JSON object with street, city, and postal_code';
        END IF;

        INSERT INTO addresses(street, city, postal_code)
        VALUES (
            p_address->>'street',
            p_address->>'city',
            p_address->>'postal_code'
        )
        RETURNING id INTO new_address_id;

        UPDATE users SET address_id = new_address_id WHERE id = p_user_id;
    END IF;

    UPDATE users
    SET 
        full_name = COALESCE(p_full_name, full_name),
        email = COALESCE(p_email, email),
        phone = COALESCE(p_phone, phone),
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Roles update
    IF p_role_ids IS NOT NULL THEN
        SELECT COUNT(*) INTO role_count FROM roles WHERE id = ANY(p_role_ids);
        IF role_count <> array_length(p_role_ids, 1) THEN
            RAISE EXCEPTION 'One or more roles not found';
        END IF;

        DELETE FROM user_roles WHERE user_id = p_user_id;

        INSERT INTO user_roles(user_id, role_id)
        SELECT p_user_id, unnest(p_role_ids);
    END IF;
END;
$$;


-- 5. DELETE
CREATE OR REPLACE PROCEDURE delete_user(
    IN p_id BIGINT,
    OUT id BIGINT,
    OUT full_name VARCHAR,
    OUT email VARCHAR,
    OUT phone VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN

    IF NOT EXISTS (
        SELECT 1 
        FROM users AS u  
        WHERE u.id = p_id AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    UPDATE users
    SET deleted_at = NOW()
    WHERE users.id = p_id;

    SELECT u.id, u.full_name, u.email, u.phone
    INTO id, full_name, email, phone
    FROM users u
    WHERE u.id = p_id;
END;
$$;