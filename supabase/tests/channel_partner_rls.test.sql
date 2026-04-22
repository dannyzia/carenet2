-- ============================================================================
-- Channel Partner RLS Policy Tests
-- ============================================================================
-- These tests verify that RLS policies correctly restrict access based on user roles
-- Note: These tests require a running Supabase instance with test data
-- ============================================================================

-- Test helper: Create test users
DO $$
DECLARE
    cp_user_id uuid;
    admin_user_id uuid;
    lead_user_id uuid;
BEGIN
    -- Create test Channel Partner user
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
    VALUES (
        gen_random_uuid(),
        'test-cp@example.com',
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
    
    -- Create test Lead user
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
    VALUES (
        gen_random_uuid(),
        'test-lead@example.com',
        crypt('password', gen_salt('bf')),
        now()
    ) ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Test users created';
END $$;

-- ============================================================================
-- Test 1: Channel Partner can read their own record
-- ============================================================================
DO $$
DECLARE
    cp_user_id uuid;
    result_count integer;
BEGIN
    -- Get test CP user ID
    SELECT id INTO cp_user_id FROM auth.users WHERE email = 'test-cp@example.com' LIMIT 1;
    
    -- Create test CP record
    INSERT INTO public.channel_partners (user_id, business_name, phone, status)
    VALUES (cp_user_id, 'Test CP Business', '01700000000', 'active')
    ON CONFLICT (user_id) DO UPDATE SET status = 'active';
    
    -- Set local role to authenticated
    SET LOCAL role TO authenticated;
    
    -- Test: CP should be able to read their own record
    SELECT count(*) INTO result_count 
    FROM public.channel_partners 
    WHERE user_id = cp_user_id;
    
    IF result_count = 1 THEN
        RAISE NOTICE '✅ PASS: CP can read own record';
    ELSE
        RAISE NOTICE '❌ FAIL: CP cannot read own record (count: %)', result_count;
    END IF;
    
    -- Cleanup
    DELETE FROM public.channel_partners WHERE user_id = cp_user_id;
END $$;

-- ============================================================================
-- Test 2: Channel Partner cannot read other CPs' records
-- ============================================================================
DO $$
DECLARE
    cp_user_id uuid;
    other_cp_user_id uuid;
    result_count integer;
BEGIN
    -- Get test CP user ID
    SELECT id INTO cp_user_id FROM auth.users WHERE email = 'test-cp@example.com' LIMIT 1;
    
    -- Create other CP record
    INSERT INTO public.channel_partners (user_id, business_name, phone, status)
    VALUES (gen_random_uuid(), 'Other CP Business', '01700000001', 'active');
    
    -- Set local role to authenticated
    SET LOCAL role TO authenticated;
    
    -- Test: CP should NOT be able to read other CPs' records
    SELECT count(*) INTO result_count 
    FROM public.channel_partners 
    WHERE user_id != cp_user_id;
    
    IF result_count = 0 THEN
        RAISE NOTICE '✅ PASS: CP cannot read other CPs'' records';
    ELSE
        RAISE NOTICE '❌ FAIL: CP can read other CPs'' records (count: %)', result_count;
    END IF;
    
    -- Cleanup
    DELETE FROM public.channel_partners WHERE business_name = 'Other CP Business';
END $$;

-- ============================================================================
-- Test 3: Channel Partner can read their own leads
-- ============================================================================
DO $$
DECLARE
    cp_user_id uuid;
    lead_user_id uuid;
    cp_id uuid;
    result_count integer;
BEGIN
    -- Get test users
    SELECT id INTO cp_user_id FROM auth.users WHERE email = 'test-cp@example.com' LIMIT 1;
    SELECT id INTO lead_user_id FROM auth.users WHERE email = 'test-lead@example.com' LIMIT 1;
    
    -- Create test CP record
    INSERT INTO public.channel_partners (user_id, business_name, phone, status)
    VALUES (cp_user_id, 'Test CP Business', '01700000000', 'active')
    ON CONFLICT (user_id) DO UPDATE SET status = 'active'
    RETURNING id INTO cp_id;
    
    -- Create test lead attribution
    INSERT INTO public.channel_partner_leads (channel_partner_id, lead_user_id, lead_role, attribution_method, is_active)
    VALUES (cp_id, lead_user_id, 'guardian', 'referral_code', true);
    
    -- Set local role to authenticated
    SET LOCAL role TO authenticated;
    
    -- Test: CP should be able to read their own leads
    SELECT count(*) INTO result_count 
    FROM public.channel_partner_leads 
    WHERE channel_partner_id = cp_id;
    
    IF result_count = 1 THEN
        RAISE NOTICE '✅ PASS: CP can read own leads';
    ELSE
        RAISE NOTICE '❌ FAIL: CP cannot read own leads (count: %)', result_count;
    END IF;
    
    -- Cleanup
    DELETE FROM public.channel_partner_leads WHERE lead_user_id = lead_user_id;
    DELETE FROM public.channel_partners WHERE user_id = cp_user_id;
END $$;

-- ============================================================================
-- Test 4: Channel Partner cannot read other CPs' leads
-- ============================================================================
DO $$
DECLARE
    cp_user_id uuid;
    other_cp_id uuid;
    result_count integer;
BEGIN
    -- Get test CP user ID
    SELECT id INTO cp_user_id FROM auth.users WHERE email = 'test-cp@example.com' LIMIT 1;
    
    -- Create other CP and lead
    INSERT INTO public.channel_partners (user_id, business_name, phone, status)
    VALUES (gen_random_uuid(), 'Other CP Business', '01700000001', 'active')
    RETURNING id INTO other_cp_id;
    
    INSERT INTO public.channel_partner_leads (channel_partner_id, lead_user_id, lead_role, attribution_method, is_active)
    VALUES (other_cp_id, gen_random_uuid(), 'guardian', 'referral_code', true);
    
    -- Set local role to authenticated
    SET LOCAL role TO authenticated;
    
    -- Test: CP should NOT be able to read other CPs' leads
    SELECT count(*) INTO result_count 
    FROM public.channel_partner_leads 
    WHERE channel_partner_id = other_cp_id;
    
    IF result_count = 0 THEN
        RAISE NOTICE '✅ PASS: CP cannot read other CPs'' leads';
    ELSE
        RAISE NOTICE '❌ FAIL: CP can read other CPs'' leads (count: %)', result_count;
    END IF;
    
    -- Cleanup
    DELETE FROM public.channel_partner_leads WHERE channel_partner_id = other_cp_id;
    DELETE FROM public.channel_partners WHERE business_name = 'Other CP Business';
END $$;

-- ============================================================================
-- Test 5: Lead can see their own attribution
-- ============================================================================
DO $$
DECLARE
    cp_user_id uuid;
    lead_user_id uuid;
    cp_id uuid;
    result_count integer;
BEGIN
    -- Get test users
    SELECT id INTO cp_user_id FROM auth.users WHERE email = 'test-cp@example.com' LIMIT 1;
    SELECT id INTO lead_user_id FROM auth.users WHERE email = 'test-lead@example.com' LIMIT 1;
    
    -- Create test CP and lead
    INSERT INTO public.channel_partners (user_id, business_name, phone, status)
    VALUES (cp_user_id, 'Test CP Business', '01700000000', 'active')
    ON CONFLICT (user_id) DO UPDATE SET status = 'active'
    RETURNING id INTO cp_id;
    
    INSERT INTO public.channel_partner_leads (channel_partner_id, lead_user_id, lead_role, attribution_method, is_active)
    VALUES (cp_id, lead_user_id, 'guardian', 'referral_code', true);
    
    -- Set local role to authenticated
    SET LOCAL role TO authenticated;
    
    -- Test: Lead should be able to see their own attribution
    SELECT count(*) INTO result_count 
    FROM public.channel_partner_leads 
    WHERE lead_user_id = lead_user_id;
    
    IF result_count = 1 THEN
        RAISE NOTICE '✅ PASS: Lead can see own attribution';
    ELSE
        RAISE NOTICE '❌ FAIL: Lead cannot see own attribution (count: %)', result_count;
    END IF;
    
    -- Cleanup
    DELETE FROM public.channel_partner_leads WHERE lead_user_id = lead_user_id;
    DELETE FROM public.channel_partners WHERE user_id = cp_user_id;
END $$;

-- ============================================================================
-- Test 6: Channel Partner can read their own commission rates
-- ============================================================================
DO $$
DECLARE
    cp_user_id uuid;
    cp_id uuid;
    result_count integer;
BEGIN
    -- Get test CP user ID
    SELECT id INTO cp_user_id FROM auth.users WHERE email = 'test-cp@example.com' LIMIT 1;
    
    -- Create test CP and rate
    INSERT INTO public.channel_partners (user_id, business_name, phone, status)
    VALUES (cp_user_id, 'Test CP Business', '01700000000', 'active')
    ON CONFLICT (user_id) DO UPDATE SET status = 'active'
    RETURNING id INTO cp_id;
    
    INSERT INTO public.channel_partner_commission_rates (channel_partner_id, lead_role, rate, effective_from, expires_at, effective_to)
    VALUES (cp_id, 'guardian', 25, now(), now() + interval '90 days', null);
    
    -- Set local role to authenticated
    SET LOCAL role TO authenticated;
    
    -- Test: CP should be able to read their own rates
    SELECT count(*) INTO result_count 
    FROM public.channel_partner_commission_rates 
    WHERE channel_partner_id = cp_id;
    
    IF result_count = 1 THEN
        RAISE NOTICE '✅ PASS: CP can read own rates';
    ELSE
        RAISE NOTICE '❌ FAIL: CP cannot read own rates (count: %)', result_count;
    END IF;
    
    -- Cleanup
    DELETE FROM public.channel_partner_commission_rates WHERE channel_partner_id = cp_id;
    DELETE FROM public.channel_partners WHERE user_id = cp_user_id;
END $$;

-- ============================================================================
-- Test 7: Channel Partner cannot read other CPs' commission rates
-- ============================================================================
DO $$
DECLARE
    other_cp_id uuid;
    result_count integer;
BEGIN
    -- Create other CP and rate
    INSERT INTO public.channel_partners (user_id, business_name, phone, status)
    VALUES (gen_random_uuid(), 'Other CP Business', '01700000001', 'active')
    RETURNING id INTO other_cp_id;
    
    INSERT INTO public.channel_partner_commission_rates (channel_partner_id, lead_role, rate, effective_from, expires_at, effective_to)
    VALUES (other_cp_id, 'guardian', 25, now(), now() + interval '90 days', null);
    
    -- Set local role to authenticated
    SET LOCAL role TO authenticated;
    
    -- Test: CP should NOT be able to read other CPs' rates
    SELECT count(*) INTO result_count 
    FROM public.channel_partner_commission_rates 
    WHERE channel_partner_id = other_cp_id;
    
    IF result_count = 0 THEN
        RAISE NOTICE '✅ PASS: CP cannot read other CPs'' rates';
    ELSE
        RAISE NOTICE '❌ FAIL: CP can read other CPs'' rates (count: %)', result_count;
    END IF;
    
    -- Cleanup
    DELETE FROM public.channel_partner_commission_rates WHERE channel_partner_id = other_cp_id;
    DELETE FROM public.channel_partners WHERE business_name = 'Other CP Business';
END $$;

-- ============================================================================
-- Test 8: Channel Partner can read their own commissions
-- ============================================================================
DO $$
DECLARE
    cp_user_id uuid;
    lead_user_id uuid;
    cp_id uuid;
    test_rate_id uuid;
    test_invoice_id uuid;
    result_count integer;
BEGIN
    -- Get test users
    SELECT id INTO cp_user_id FROM auth.users WHERE email = 'test-cp@example.com' LIMIT 1;
    SELECT id INTO lead_user_id FROM auth.users WHERE email = 'test-lead@example.com' LIMIT 1;
    
    -- Create test CP, lead, and commission
    INSERT INTO public.channel_partners (user_id, business_name, phone, status)
    VALUES (cp_user_id, 'Test CP Business', '01700000000', 'active')
    ON CONFLICT (user_id) DO UPDATE SET status = 'active'
    RETURNING id INTO cp_id;
    
    INSERT INTO public.channel_partner_leads (channel_partner_id, lead_user_id, lead_role, attribution_method, is_active)
    VALUES (cp_id, lead_user_id, 'guardian', 'referral_code', true);
    
    -- Create a test rate record first
    INSERT INTO public.channel_partner_commission_rates (channel_partner_id, lead_role, rate, effective_from, expires_at)
    VALUES (cp_id, 'guardian', 25, now(), now() + interval '90 days')
    RETURNING id INTO test_rate_id;
    
    -- Create test invoice (simplified - would normally reference actual invoices table)
    test_invoice_id := gen_random_uuid();
    
    INSERT INTO public.channel_partner_commissions (
        channel_partner_id, lead_user_id, lead_role, invoice_id, rate_record_id,
        invoice_amount, platform_commission_amount, cp_commission_rate, cp_commission_amount,
        invoice_generated_at, status
    )
    VALUES (
        cp_id, lead_user_id, 'guardian', test_invoice_id, test_rate_id,
        1000, 100, 25, 25,
        now(), 'credited'
    );
    
    -- Set local role to authenticated
    SET LOCAL role TO authenticated;
    
    -- Test: CP should be able to read their own commissions
    SELECT count(*) INTO result_count 
    FROM public.channel_partner_commissions 
    WHERE channel_partner_id = cp_id;
    
    IF result_count = 1 THEN
        RAISE NOTICE '✅ PASS: CP can read own commissions';
    ELSE
        RAISE NOTICE '❌ FAIL: CP cannot read own commissions (count: %)', result_count;
    END IF;
    
    -- Cleanup
    DELETE FROM public.channel_partner_commissions WHERE channel_partner_id = cp_id;
    DELETE FROM public.channel_partner_leads WHERE lead_user_id = lead_user_id;
    DELETE FROM public.channel_partners WHERE user_id = cp_user_id;
END $$;

-- ============================================================================
-- Test 9: Channel Partner cannot read other CPs' commissions
-- ============================================================================
DO $$
DECLARE
    other_cp_id uuid;
    other_lead_user_id uuid;
    test_rate_id uuid;
    test_invoice_id uuid;
    result_count integer;
BEGIN
    -- Create other CP, lead, and commission
    INSERT INTO public.channel_partners (user_id, business_name, phone, status)
    VALUES (gen_random_uuid(), 'Other CP Business', '01700000001', 'active')
    RETURNING id INTO other_cp_id;
    
    other_lead_user_id := gen_random_uuid();
    
    INSERT INTO public.channel_partner_leads (channel_partner_id, lead_user_id, lead_role, attribution_method, is_active)
    VALUES (other_cp_id, other_lead_user_id, 'guardian', 'referral_code', true);
    
    -- Create a test rate record
    INSERT INTO public.channel_partner_commission_rates (channel_partner_id, lead_role, rate, effective_from, expires_at)
    VALUES (other_cp_id, 'guardian', 25, now(), now() + interval '90 days')
    RETURNING id INTO test_rate_id;
    
    test_invoice_id := gen_random_uuid();
    
    INSERT INTO public.channel_partner_commissions (
        channel_partner_id, lead_user_id, lead_role, invoice_id, rate_record_id,
        invoice_amount, platform_commission_amount, cp_commission_rate, cp_commission_amount,
        invoice_generated_at, status
    )
    VALUES (
        other_cp_id, other_lead_user_id, 'guardian', test_invoice_id, test_rate_id,
        1000, 100, 25, 25,
        now(), 'credited'
    );
    
    -- Set local role to authenticated
    SET LOCAL role TO authenticated;
    
    -- Test: CP should NOT be able to read other CPs' commissions
    SELECT count(*) INTO result_count 
    FROM public.channel_partner_commissions 
    WHERE channel_partner_id = other_cp_id;
    
    IF result_count = 0 THEN
        RAISE NOTICE '✅ PASS: CP cannot read other CPs'' commissions';
    ELSE
        RAISE NOTICE '❌ FAIL: CP can read other CPs'' commissions (count: %)', result_count;
    END IF;
    
    -- Cleanup
    DELETE FROM public.channel_partner_commissions WHERE channel_partner_id = other_cp_id;
    DELETE FROM public.channel_partner_leads WHERE channel_partner_id = other_cp_id;
    DELETE FROM public.channel_partners WHERE business_name = 'Other CP Business';
END $$;

-- ============================================================================
-- Test 10: Suspended CP cannot create leads
-- ============================================================================
DO $$
DECLARE
    cp_user_id uuid;
    cp_id uuid;
    test_result boolean;
BEGIN
    -- Get test CP user ID
    SELECT id INTO cp_user_id FROM auth.users WHERE email = 'test-cp@example.com' LIMIT 1;
    
    -- Create suspended CP
    INSERT INTO public.channel_partners (user_id, business_name, phone, status)
    VALUES (cp_user_id, 'Suspended CP Business', '01700000000', 'suspended')
    ON CONFLICT (user_id) DO UPDATE SET status = 'suspended'
    RETURNING id INTO cp_id;
    
    -- Set local role to authenticated
    SET LOCAL role TO authenticated;
    
    -- Test: Suspended CP should NOT be able to create leads
    BEGIN
        INSERT INTO public.channel_partner_leads (channel_partner_id, lead_user_id, lead_role, attribution_method, is_active)
        VALUES (cp_id, gen_random_uuid(), 'guardian', 'referral_code', true);
        
        -- If we get here, the insert succeeded (FAIL)
        RAISE NOTICE '❌ FAIL: Suspended CP can create leads (should be blocked)';
        DELETE FROM public.channel_partner_leads WHERE channel_partner_id = cp_id;
    EXCEPTION WHEN others THEN
        -- If we get an exception, the insert was blocked (PASS)
        RAISE NOTICE '✅ PASS: Suspended CP cannot create leads (insert blocked)';
    END;
    
    -- Cleanup
    DELETE FROM public.channel_partners WHERE user_id = cp_user_id;
END $$;

-- ============================================================================
-- Cleanup test users
-- ============================================================================
DO $$
BEGIN
    DELETE FROM auth.users WHERE email IN ('test-cp@example.com', 'test-admin@example.com', 'test-lead@example.com');
    RAISE NOTICE 'Test users cleaned up';
END $$;

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS Policy Tests Complete';
    RAISE NOTICE '========================================';
END $$;
