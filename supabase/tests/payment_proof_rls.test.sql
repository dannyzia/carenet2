-- ============================================================================
-- Payment Proof RLS Policy Tests (Central Payment Gateway)
-- ============================================================================
-- These tests verify that RLS policies correctly restrict access based on user roles
-- Note: These tests require a running Supabase instance with test data
-- ============================================================================

-- Test helper: Create test users
DO $$
DECLARE
    provider_user_id uuid;
    admin_user_id uuid;
    guardian_user_id uuid;
    moderator_user_id uuid;
BEGIN
    -- Create test Provider user
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
    VALUES (
        gen_random_uuid(),
        'test-provider@example.com',
        crypt('password', gen_salt('bf')),
        now()
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Create test Admin user
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
    VALUES (
        gen_random_uuid(),
        'test-admin@example.com',
        crypt('password', gen_salt('bf')),
        now()
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Create test Guardian user
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
    VALUES (
        gen_random_uuid(),
        'test-guardian@example.com',
        crypt('password', gen_salt('bf')),
        now()
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Create test Moderator user
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
    VALUES (
        gen_random_uuid(),
        'test-moderator@example.com',
        crypt('password', gen_salt('bf')),
        now()
    ) ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Test users created';
END $$;

-- ============================================================================
-- Test 1: Provider JWT → UPDATE payment_proofs SET status='verified' → expect RLS violation
-- ============================================================================
DO $$
DECLARE
    provider_user_id uuid;
    proof_id uuid;
    invoice_id uuid;
BEGIN
    -- Get test Provider user ID
    SELECT id INTO provider_user_id FROM auth.users WHERE email = 'test-provider@example.com' LIMIT 1;
    
    -- Create test profile for provider
    INSERT INTO public.profiles (id, role, full_name)
    VALUES (provider_user_id, 'agency', 'Test Provider')
    ON CONFLICT (id) DO UPDATE SET role = 'agency';
    
    -- Create test invoice
    invoice_id := gen_random_uuid();
    INSERT INTO public.invoices (id, from_party_id, to_party_id, subtotal, total, status, due_date)
    VALUES (invoice_id, provider_user_id, gen_random_uuid(), 1000, 1000, 'unpaid', now() + interval '7 days');
    
    -- Create test payment proof
    proof_id := gen_random_uuid();
    INSERT INTO public.payment_proofs (
        id, invoice_id, submitted_by_id, received_by_id, 
        submitted_by_name, received_by_name, submitted_by_role, received_by_role,
        amount, method, reference_number, status, submitted_at
    )
    VALUES (
        proof_id, invoice_id, gen_random_uuid(), gen_random_uuid(),
        'Test Guardian', 'Test Admin', 'guardian', 'admin',
        1000, 'bkash', '123456', 'pending', now()
    );
    
    -- Set local role to authenticated and simulate provider JWT
    SET LOCAL role TO authenticated;
    SET LOCAL request.jwt.claim.sub TO provider_user_id::text;
    
    -- Test: Provider should NOT be able to UPDATE payment_proofs status
    BEGIN
        UPDATE public.payment_proofs SET status = 'verified' WHERE id = proof_id;
        
        -- If we get here, the update succeeded (FAIL)
        RAISE NOTICE '❌ FAIL: Provider can UPDATE payment_proofs (should be blocked)';
        UPDATE public.payment_proofs SET status = 'pending' WHERE id = proof_id;
    EXCEPTION WHEN others THEN
        -- If we get an exception, the update was blocked (PASS)
        RAISE NOTICE '✅ PASS: Provider cannot UPDATE payment_proofs (RLS violation)';
    END;
    
    -- Cleanup
    DELETE FROM public.payment_proofs WHERE id = proof_id;
    DELETE FROM public.invoices WHERE id = invoice_id;
    DELETE FROM public.profiles WHERE id = provider_user_id;
END $$;

-- ============================================================================
-- Test 2: Admin JWT → UPDATE payment_proofs SET status='verified' → expect success
-- ============================================================================
DO $$
DECLARE
    admin_user_id uuid;
    proof_id uuid;
    invoice_id uuid;
    result_count integer;
BEGIN
    -- Get test Admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'test-admin@example.com' LIMIT 1;
    
    -- Create test profile for admin
    INSERT INTO public.profiles (id, role, full_name)
    VALUES (admin_user_id, 'admin', 'Test Admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
    
    -- Create test invoice
    invoice_id := gen_random_uuid();
    INSERT INTO public.invoices (id, from_party_id, to_party_id, subtotal, total, status, due_date)
    VALUES (invoice_id, gen_random_uuid(), gen_random_uuid(), 1000, 1000, 'unpaid', now() + interval '7 days');
    
    -- Create test payment proof
    proof_id := gen_random_uuid();
    INSERT INTO public.payment_proofs (
        id, invoice_id, submitted_by_id, received_by_id, 
        submitted_by_name, received_by_name, submitted_by_role, received_by_role,
        amount, method, reference_number, status, submitted_at
    )
    VALUES (
        proof_id, invoice_id, gen_random_uuid(), gen_random_uuid(),
        'Test Guardian', 'Test Admin', 'guardian', 'admin',
        1000, 'bkash', '123456', 'pending', now()
    );
    
    -- Set local role to authenticated and simulate admin JWT
    SET LOCAL role TO authenticated;
    SET LOCAL request.jwt.claim.sub TO admin_user_id::text;
    
    -- Test: Admin should be able to UPDATE payment_proofs status
    UPDATE public.payment_proofs SET status = 'verified' WHERE id = proof_id;
    
    SELECT count(*) INTO result_count FROM public.payment_proofs WHERE id = proof_id AND status = 'verified';
    
    IF result_count = 1 THEN
        RAISE NOTICE '✅ PASS: Admin can UPDATE payment_proofs';
    ELSE
        RAISE NOTICE '❌ FAIL: Admin cannot UPDATE payment_proofs (count: %)', result_count;
    END IF;
    
    -- Cleanup
    DELETE FROM public.payment_proofs WHERE id = proof_id;
    DELETE FROM public.invoices WHERE id = invoice_id;
    DELETE FROM public.profiles WHERE id = admin_user_id;
END $$;

-- ============================================================================
-- Test 3: Provider A JWT → SELECT proofs for Provider B's invoice → expect 0 rows
-- ============================================================================
DO $$
DECLARE
    provider_a_user_id uuid;
    provider_b_user_id uuid;
    proof_id uuid;
    invoice_id uuid;
    result_count integer;
BEGIN
    -- Get test Provider user IDs
    SELECT id INTO provider_a_user_id FROM auth.users WHERE email = 'test-provider@example.com' LIMIT 1;
    
    -- Create Provider B
    provider_b_user_id := gen_random_uuid();
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
    VALUES (provider_b_user_id, 'test-provider-b@example.com', crypt('password', gen_salt('bf')), now())
    ON CONFLICT (id) DO NOTHING;
    
    -- Create profiles
    INSERT INTO public.profiles (id, role, full_name)
    VALUES (provider_a_user_id, 'agency', 'Provider A')
    ON CONFLICT (id) DO UPDATE SET role = 'agency';
    
    INSERT INTO public.profiles (id, role, full_name)
    VALUES (provider_b_user_id, 'agency', 'Provider B')
    ON CONFLICT (id) DO UPDATE SET role = 'agency';
    
    -- Create invoice for Provider B
    invoice_id := gen_random_uuid();
    INSERT INTO public.invoices (id, from_party_id, to_party_id, subtotal, total, status, due_date)
    VALUES (invoice_id, provider_b_user_id, gen_random_uuid(), 1000, 1000, 'unpaid', now() + interval '7 days');
    
    -- Create payment proof for Provider B's invoice
    proof_id := gen_random_uuid();
    INSERT INTO public.payment_proofs (
        id, invoice_id, submitted_by_id, received_by_id, 
        submitted_by_name, received_by_name, submitted_by_role, received_by_role,
        amount, method, reference_number, status, submitted_at
    )
    VALUES (
        proof_id, invoice_id, gen_random_uuid(), gen_random_uuid(),
        'Test Guardian', 'Test Admin', 'guardian', 'admin',
        1000, 'bkash', '123456', 'pending', now()
    );
    
    -- Set local role to authenticated and simulate Provider A JWT
    SET LOCAL role TO authenticated;
    SET LOCAL request.jwt.claim.sub TO provider_a_user_id::text;
    
    -- Test: Provider A should NOT be able to SELECT proofs for Provider B's invoice
    SELECT count(*) INTO result_count FROM public.payment_proofs WHERE invoice_id = invoice_id;
    
    IF result_count = 0 THEN
        RAISE NOTICE '✅ PASS: Provider A cannot SELECT proofs for Provider B''s invoice';
    ELSE
        RAISE NOTICE '❌ FAIL: Provider A can SELECT proofs for Provider B''s invoice (count: %)', result_count;
    END IF;
    
    -- Cleanup
    DELETE FROM public.payment_proofs WHERE id = proof_id;
    DELETE FROM public.invoices WHERE id = invoice_id;
    DELETE FROM public.profiles WHERE id IN (provider_a_user_id, provider_b_user_id);
    DELETE FROM auth.users WHERE email = 'test-provider-b@example.com';
END $$;

-- ============================================================================
-- Test 4: Admin JWT → SELECT all payment_proofs → expect all rows
-- ============================================================================
DO $$
DECLARE
    admin_user_id uuid;
    proof_1_id uuid;
    proof_2_id uuid;
    invoice_1_id uuid;
    invoice_2_id uuid;
    result_count integer;
BEGIN
    -- Get test Admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'test-admin@example.com' LIMIT 1;
    
    -- Create test profile for admin
    INSERT INTO public.profiles (id, role, full_name)
    VALUES (admin_user_id, 'admin', 'Test Admin')
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
    
    -- Create two test invoices
    invoice_1_id := gen_random_uuid();
    invoice_2_id := gen_random_uuid();
    INSERT INTO public.invoices (id, from_party_id, to_party_id, subtotal, total, status, due_date)
    VALUES (invoice_1_id, gen_random_uuid(), gen_random_uuid(), 1000, 1000, 'unpaid', now() + interval '7 days'),
           (invoice_2_id, gen_random_uuid(), gen_random_uuid(), 2000, 2000, 'unpaid', now() + interval '7 days');
    
    -- Create two test payment proofs
    proof_1_id := gen_random_uuid();
    proof_2_id := gen_random_uuid();
    INSERT INTO public.payment_proofs (
        id, invoice_id, submitted_by_id, received_by_id, 
        submitted_by_name, received_by_name, submitted_by_role, received_by_role,
        amount, method, reference_number, status, submitted_at
    )
    VALUES (
        proof_1_id, invoice_1_id, gen_random_uuid(), gen_random_uuid(),
        'Test Guardian 1', 'Test Admin', 'guardian', 'admin',
        1000, 'bkash', '123456', 'pending', now()
    ),
    (
        proof_2_id, invoice_2_id, gen_random_uuid(), gen_random_uuid(),
        'Test Guardian 2', 'Test Admin', 'guardian', 'admin',
        2000, 'nagad', '789012', 'pending', now()
    );
    
    -- Set local role to authenticated and simulate admin JWT
    SET LOCAL role TO authenticated;
    SET LOCAL request.jwt.claim.sub TO admin_user_id::text;
    
    -- Test: Admin should be able to SELECT all payment_proofs
    SELECT count(*) INTO result_count FROM public.payment_proofs WHERE id IN (proof_1_id, proof_2_id);
    
    IF result_count = 2 THEN
        RAISE NOTICE '✅ PASS: Admin can SELECT all payment_proofs';
    ELSE
        RAISE NOTICE '❌ FAIL: Admin cannot SELECT all payment_proofs (count: %)', result_count;
    END IF;
    
    -- Cleanup
    DELETE FROM public.payment_proofs WHERE id IN (proof_1_id, proof_2_id);
    DELETE FROM public.invoices WHERE id IN (invoice_1_id, invoice_2_id);
    DELETE FROM public.profiles WHERE id = admin_user_id;
END $$;

-- ============================================================================
-- Test 5: Moderator with moderator_can_verify_payments = false → UPDATE blocked
-- ============================================================================
DO $$
DECLARE
    moderator_user_id uuid;
    proof_id uuid;
    invoice_id uuid;
BEGIN
    -- Get test Moderator user ID
    SELECT id INTO moderator_user_id FROM auth.users WHERE email = 'test-moderator@example.com' LIMIT 1;
    
    -- Create test profile for moderator
    INSERT INTO public.profiles (id, role, full_name)
    VALUES (moderator_user_id, 'moderator', 'Test Moderator')
    ON CONFLICT (id) DO UPDATE SET role = 'moderator';
    
    -- Ensure moderator_can_verify_payments is false
    INSERT INTO public.platform_config (key, value)
    VALUES ('moderator_can_verify_payments', 'false')
    ON CONFLICT (key) DO UPDATE SET value = 'false';
    
    -- Create test invoice
    invoice_id := gen_random_uuid();
    INSERT INTO public.invoices (id, from_party_id, to_party_id, subtotal, total, status, due_date)
    VALUES (invoice_id, gen_random_uuid(), gen_random_uuid(), 1000, 1000, 'unpaid', now() + interval '7 days');
    
    -- Create test payment proof
    proof_id := gen_random_uuid();
    INSERT INTO public.payment_proofs (
        id, invoice_id, submitted_by_id, received_by_id, 
        submitted_by_name, received_by_name, submitted_by_role, received_by_role,
        amount, method, reference_number, status, submitted_at
    )
    VALUES (
        proof_id, invoice_id, gen_random_uuid(), gen_random_uuid(),
        'Test Guardian', 'Test Admin', 'guardian', 'admin',
        1000, 'bkash', '123456', 'pending', now()
    );
    
    -- Set local role to authenticated and simulate moderator JWT
    SET LOCAL role TO authenticated;
    SET LOCAL request.jwt.claim.sub TO moderator_user_id::text;
    
    -- Test: Moderator with config disabled should NOT be able to UPDATE payment_proofs
    BEGIN
        UPDATE public.payment_proofs SET status = 'verified' WHERE id = proof_id;
        
        -- If we get here, the update succeeded (FAIL)
        RAISE NOTICE '❌ FAIL: Moderator with config disabled can UPDATE payment_proofs (should be blocked)';
        UPDATE public.payment_proofs SET status = 'pending' WHERE id = proof_id;
    EXCEPTION WHEN others THEN
        -- If we get an exception, the update was blocked (PASS)
        RAISE NOTICE '✅ PASS: Moderator with config disabled cannot UPDATE payment_proofs (RLS violation)';
    END;
    
    -- Cleanup
    DELETE FROM public.payment_proofs WHERE id = proof_id;
    DELETE FROM public.invoices WHERE id = invoice_id;
    DELETE FROM public.profiles WHERE id = moderator_user_id;
    DELETE FROM public.platform_config WHERE key = 'moderator_can_verify_payments';
END $$;

-- ============================================================================
-- Cleanup test users
-- ============================================================================
DO $$
BEGIN
    DELETE FROM auth.users WHERE email IN (
        'test-provider@example.com', 
        'test-admin@example.com', 
        'test-guardian@example.com',
        'test-moderator@example.com'
    );
    RAISE NOTICE 'Test users cleaned up';
END $$;

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Payment Proof RLS Tests Complete';
    RAISE NOTICE '========================================';
END $$;
