-- PostgreSQL database dump
--

\restrict d9Pe6Gg3zwinFV0PfzM8PnW9D9b65slZeUHZN7uCNTEsPdvtd9H1eLwezl1dvrq

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.token_blacklist_outstandingtoken DROP CONSTRAINT IF EXISTS token_blacklist_outs_user_id_83bc629a_fk_auth_user;
ALTER TABLE IF EXISTS ONLY public.token_blacklist_blacklistedtoken DROP CONSTRAINT IF EXISTS token_blacklist_blacklistedtoken_token_id_3cc7fe56_fk;
ALTER TABLE IF EXISTS ONLY public.student_benefits DROP CONSTRAINT IF EXISTS student_benefits_seller_id_44294f62_fk_seller_profiles_id;
ALTER TABLE IF EXISTS ONLY public.student_benefits DROP CONSTRAINT IF EXISTS student_benefits_granted_by_id_ed62eced_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.stores DROP CONSTRAINT IF EXISTS stores_university_id_e1bfd5b6_fk_universities_id;
ALTER TABLE IF EXISTS ONLY public.stores DROP CONSTRAINT IF EXISTS stores_seller_id_99695f06_fk_seller_profiles_id;
ALTER TABLE IF EXISTS ONLY public.stores DROP CONSTRAINT IF EXISTS stores_approved_by_id_3b7ab3f8_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.seller_profiles DROP CONSTRAINT IF EXISTS seller_profiles_user_id_72942661_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.seller_profiles DROP CONSTRAINT IF EXISTS seller_profiles_approved_by_id_ed979e67_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.seller_payout_requests DROP CONSTRAINT IF EXISTS seller_payout_requests_seller_id_5183e350_fk_seller_profiles_id;
ALTER TABLE IF EXISTS ONLY public.seller_payout_requests DROP CONSTRAINT IF EXISTS seller_payout_reques_processed_by_id_c2bbd490_fk_auth_user;
ALTER TABLE IF EXISTS ONLY public.seller_badges DROP CONSTRAINT IF EXISTS seller_badges_store_id_86266f4d_fk_stores_id;
ALTER TABLE IF EXISTS ONLY public.seller_badges DROP CONSTRAINT IF EXISTS seller_badges_awarded_by_id_b779683a_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.marketplace_reviews DROP CONSTRAINT IF EXISTS marketplace_reviews_seller_id_c789c9b9_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.marketplace_reviews DROP CONSTRAINT IF EXISTS marketplace_reviews_reviewer_id_5a8443e1_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.marketplace_reviews DROP CONSTRAINT IF EXISTS marketplace_reviews_product_id_d1bde052_fk_marketpla;
ALTER TABLE IF EXISTS ONLY public.marketplace_reports DROP CONSTRAINT IF EXISTS marketplace_reports_reviewed_by_id_b74e134e_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.marketplace_reports DROP CONSTRAINT IF EXISTS marketplace_reports_reporter_id_1819e8c8_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.marketplace_reports DROP CONSTRAINT IF EXISTS marketplace_reports_product_id_1b728ee5_fk_marketpla;
ALTER TABLE IF EXISTS ONLY public.marketplace_products DROP CONSTRAINT IF EXISTS marketplace_products_user_id_10a1a42f_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.marketplace_products DROP CONSTRAINT IF EXISTS marketplace_products_university_id_dffc23f2_fk_universities_id;
ALTER TABLE IF EXISTS ONLY public.marketplace_products DROP CONSTRAINT IF EXISTS marketplace_products_reviewed_by_id_1c7cd6e4_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.marketplace_products DROP CONSTRAINT IF EXISTS marketplace_products_category_id_1e516680_fk_marketpla;
ALTER TABLE IF EXISTS ONLY public.marketplace_product_images DROP CONSTRAINT IF EXISTS marketplace_product__product_id_16b501e2_fk_marketpla;
ALTER TABLE IF EXISTS ONLY public.marketplace_offers DROP CONSTRAINT IF EXISTS marketplace_offers_product_id_f0d2df42_fk_marketpla;
ALTER TABLE IF EXISTS ONLY public.marketplace_offers DROP CONSTRAINT IF EXISTS marketplace_offers_buyer_id_301e04e8_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.marketplace_messages DROP CONSTRAINT IF EXISTS marketplace_messages_sender_id_7a1b4a4a_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.marketplace_messages DROP CONSTRAINT IF EXISTS marketplace_messages_chat_id_0d47c0ee_fk_marketplace_chats_id;
ALTER TABLE IF EXISTS ONLY public.marketplace_chats DROP CONSTRAINT IF EXISTS marketplace_chats_seller_id_23a71905_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.marketplace_chats DROP CONSTRAINT IF EXISTS marketplace_chats_product_id_b156327b_fk_marketpla;
ALTER TABLE IF EXISTS ONLY public.marketplace_chats DROP CONSTRAINT IF EXISTS marketplace_chats_buyer_id_b28a1472_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.marketplace_categories DROP CONSTRAINT IF EXISTS marketplace_categori_parent_id_28e0c083_fk_marketpla;
ALTER TABLE IF EXISTS ONLY public.django_celery_beat_periodictask DROP CONSTRAINT IF EXISTS django_celery_beat_p_solar_id_a87ce72c_fk_django_ce;
ALTER TABLE IF EXISTS ONLY public.django_celery_beat_periodictask DROP CONSTRAINT IF EXISTS django_celery_beat_p_interval_id_a8ca27da_fk_django_ce;
ALTER TABLE IF EXISTS ONLY public.django_celery_beat_periodictask DROP CONSTRAINT IF EXISTS django_celery_beat_p_crontab_id_d3cba168_fk_django_ce;
ALTER TABLE IF EXISTS ONLY public.django_celery_beat_periodictask DROP CONSTRAINT IF EXISTS django_celery_beat_p_clocked_id_47a69f82_fk_django_ce;
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_user_id_c564eba6_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_content_type_id_c4bce8eb_fk_django_co;
ALTER TABLE IF EXISTS ONLY public.auth_users_user_permissions DROP CONSTRAINT IF EXISTS auth_users_user_permissions_user_id_9a4c5204_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.auth_users_user_permissions DROP CONSTRAINT IF EXISTS auth_users_user_perm_permission_id_ed9ffa4c_fk_auth_perm;
ALTER TABLE IF EXISTS ONLY public.auth_users DROP CONSTRAINT IF EXISTS auth_users_university_id_17e6a682_fk_universities_id;
ALTER TABLE IF EXISTS ONLY public.auth_users_groups DROP CONSTRAINT IF EXISTS auth_users_groups_user_id_70322499_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.auth_users_groups DROP CONSTRAINT IF EXISTS auth_users_groups_group_id_0f75702f_fk_auth_group_id;
ALTER TABLE IF EXISTS ONLY public.auth_user_verifications DROP CONSTRAINT IF EXISTS auth_user_verifications_user_id_e30039ee_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.auth_user_verifications DROP CONSTRAINT IF EXISTS auth_user_verificati_reviewed_by_id_3125802c_fk_auth_user;
ALTER TABLE IF EXISTS ONLY public.auth_user_sessions DROP CONSTRAINT IF EXISTS auth_user_sessions_user_id_fbf11f9e_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.auth_user_addresses DROP CONSTRAINT IF EXISTS auth_user_addresses_user_id_04f87b71_fk_auth_users_id;
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_content_type_id_2f476e4b_fk_django_co;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_group_id_b120cbf9_fk_auth_group_id;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissio_permission_id_84c5c92e_fk_auth_perm;
ALTER TABLE IF EXISTS ONLY public.auth_email_verification_tokens DROP CONSTRAINT IF EXISTS auth_email_verificat_user_id_b858f3e8_fk_auth_user;
DROP INDEX IF EXISTS public.universities_system_id_700b6bcc_like;
DROP INDEX IF EXISTS public.universities_slug_c7344b51_like;
DROP INDEX IF EXISTS public.universities_short_name_a75acd00_like;
DROP INDEX IF EXISTS public.universities_name_e14f6591_like;
DROP INDEX IF EXISTS public.universities_is_active_f5867649;
DROP INDEX IF EXISTS public.universities_deleted_at_8ca68393;
DROP INDEX IF EXISTS public.universities_created_at_7874a6aa;
DROP INDEX IF EXISTS public.token_blacklist_outstandingtoken_user_id_83bc629a;
DROP INDEX IF EXISTS public.token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_like;
DROP INDEX IF EXISTS public.student_benefits_seller_id_44294f62;
DROP INDEX IF EXISTS public.student_benefits_granted_by_id_ed62eced;
DROP INDEX IF EXISTS public.student_benefits_deleted_at_a00c8510;
DROP INDEX IF EXISTS public.student_benefits_created_at_4136ae02;
DROP INDEX IF EXISTS public.stores_university_id_e1bfd5b6;
DROP INDEX IF EXISTS public.stores_status_245de046_like;
DROP INDEX IF EXISTS public.stores_status_245de046;
DROP INDEX IF EXISTS public.stores_slug_c8d524d0_like;
DROP INDEX IF EXISTS public.stores_deleted_at_63afea1d;
DROP INDEX IF EXISTS public.stores_created_at_12b73478;
DROP INDEX IF EXISTS public.stores_approved_by_id_3b7ab3f8;
DROP INDEX IF EXISTS public.seller_profiles_status_e323c45e_like;
DROP INDEX IF EXISTS public.seller_profiles_status_e323c45e;
DROP INDEX IF EXISTS public.seller_profiles_deleted_at_22e3776f;
DROP INDEX IF EXISTS public.seller_profiles_created_at_a55e69e9;
DROP INDEX IF EXISTS public.seller_profiles_approved_by_id_ed979e67;
DROP INDEX IF EXISTS public.seller_prof_status_31c833_idx;
DROP INDEX IF EXISTS public.seller_payout_requests_status_52e24981_like;
DROP INDEX IF EXISTS public.seller_payout_requests_status_52e24981;
DROP INDEX IF EXISTS public.seller_payout_requests_seller_id_5183e350;
DROP INDEX IF EXISTS public.seller_payout_requests_processed_by_id_c2bbd490;
DROP INDEX IF EXISTS public.seller_payout_requests_deleted_at_534b9b9d;
DROP INDEX IF EXISTS public.seller_payout_requests_created_at_53dd5a08;
DROP INDEX IF EXISTS public.seller_badges_store_id_86266f4d;
DROP INDEX IF EXISTS public.seller_badges_created_at_9dbc2783;
DROP INDEX IF EXISTS public.seller_badges_awarded_by_id_b779683a;
DROP INDEX IF EXISTS public.marketplace_user_id_7771c1_idx;
DROP INDEX IF EXISTS public.marketplace_univers_3d9522_idx;
DROP INDEX IF EXISTS public.marketplace_reviews_seller_id_c789c9b9;
DROP INDEX IF EXISTS public.marketplace_reviews_reviewer_id_5a8443e1;
DROP INDEX IF EXISTS public.marketplace_reviews_product_id_d1bde052;
DROP INDEX IF EXISTS public.marketplace_reviews_deleted_at_ea823e26;
DROP INDEX IF EXISTS public.marketplace_reviews_created_at_1480c1f7;
DROP INDEX IF EXISTS public.marketplace_reports_status_43e2e9a9_like;
DROP INDEX IF EXISTS public.marketplace_reports_status_43e2e9a9;
DROP INDEX IF EXISTS public.marketplace_reports_reviewed_by_id_b74e134e;
DROP INDEX IF EXISTS public.marketplace_reports_reporter_id_1819e8c8;
DROP INDEX IF EXISTS public.marketplace_reports_product_id_1b728ee5;
DROP INDEX IF EXISTS public.marketplace_reports_deleted_at_f238f2d0;
DROP INDEX IF EXISTS public.marketplace_reports_created_at_011bfc37;
DROP INDEX IF EXISTS public.marketplace_products_user_id_10a1a42f;
DROP INDEX IF EXISTS public.marketplace_products_university_id_dffc23f2;
DROP INDEX IF EXISTS public.marketplace_products_status_a7ae22f6_like;
DROP INDEX IF EXISTS public.marketplace_products_status_a7ae22f6;
DROP INDEX IF EXISTS public.marketplace_products_reviewed_by_id_1c7cd6e4;
DROP INDEX IF EXISTS public.marketplace_products_post_type_649f5cdd_like;
DROP INDEX IF EXISTS public.marketplace_products_post_type_649f5cdd;
DROP INDEX IF EXISTS public.marketplace_products_expires_at_37c27afc;
DROP INDEX IF EXISTS public.marketplace_products_deleted_at_7f9ecb5f;
DROP INDEX IF EXISTS public.marketplace_products_created_at_d13dfd44;
DROP INDEX IF EXISTS public.marketplace_products_category_id_1e516680;
DROP INDEX IF EXISTS public.marketplace_products_campus_visibility_3a2983c8_like;
DROP INDEX IF EXISTS public.marketplace_products_campus_visibility_3a2983c8;
DROP INDEX IF EXISTS public.marketplace_product_images_product_id_16b501e2;
DROP INDEX IF EXISTS public.marketplace_product_images_created_at_1753d2da;
DROP INDEX IF EXISTS public.marketplace_offers_product_id_f0d2df42;
DROP INDEX IF EXISTS public.marketplace_offers_deleted_at_cc9506a9;
DROP INDEX IF EXISTS public.marketplace_offers_created_at_7f3c5000;
DROP INDEX IF EXISTS public.marketplace_offers_buyer_id_301e04e8;
DROP INDEX IF EXISTS public.marketplace_messages_sender_id_7a1b4a4a;
DROP INDEX IF EXISTS public.marketplace_messages_created_at_85b3b16c;
DROP INDEX IF EXISTS public.marketplace_messages_chat_id_0d47c0ee;
DROP INDEX IF EXISTS public.marketplace_expires_72caf7_idx;
DROP INDEX IF EXISTS public.marketplace_chats_seller_id_23a71905;
DROP INDEX IF EXISTS public.marketplace_chats_product_id_b156327b;
DROP INDEX IF EXISTS public.marketplace_chats_last_message_at_590656e0;
DROP INDEX IF EXISTS public.marketplace_chats_deleted_at_7d98713e;
DROP INDEX IF EXISTS public.marketplace_chats_created_at_c5ad66d2;
DROP INDEX IF EXISTS public.marketplace_chats_buyer_id_b28a1472;
DROP INDEX IF EXISTS public.marketplace_chat_id_724850_idx;
DROP INDEX IF EXISTS public.marketplace_categories_slug_4273fd8b_like;
DROP INDEX IF EXISTS public.marketplace_categories_parent_id_28e0c083;
DROP INDEX IF EXISTS public.marketplace_categories_deleted_at_91264c09;
DROP INDEX IF EXISTS public.marketplace_categories_created_at_0b5f68c6;
DROP INDEX IF EXISTS public.marketplace_categories_ad_type_633a54ed_like;
DROP INDEX IF EXISTS public.marketplace_categories_ad_type_633a54ed;
DROP INDEX IF EXISTS public.marketplace_campus__a1752a_idx;
DROP INDEX IF EXISTS public.idx_verification_user_type;
DROP INDEX IF EXISTS public.idx_verification_user_status;
DROP INDEX IF EXISTS public.idx_user_univ_role_active;
DROP INDEX IF EXISTS public.idx_user_email;
DROP INDEX IF EXISTS public.idx_univ_slug;
DROP INDEX IF EXISTS public.idx_univ_short_name;
DROP INDEX IF EXISTS public.idx_univ_is_active;
DROP INDEX IF EXISTS public.django_session_session_key_c0390e0f_like;
DROP INDEX IF EXISTS public.django_session_expire_date_a5c62663;
DROP INDEX IF EXISTS public.django_celery_beat_periodictask_solar_id_a87ce72c;
DROP INDEX IF EXISTS public.django_celery_beat_periodictask_name_265a36b7_like;
DROP INDEX IF EXISTS public.django_celery_beat_periodictask_interval_id_a8ca27da;
DROP INDEX IF EXISTS public.django_celery_beat_periodictask_crontab_id_d3cba168;
DROP INDEX IF EXISTS public.django_celery_beat_periodictask_clocked_id_47a69f82;
DROP INDEX IF EXISTS public.django_admin_log_user_id_c564eba6;
DROP INDEX IF EXISTS public.django_admin_log_content_type_id_c4bce8eb;
DROP INDEX IF EXISTS public.auth_users_user_permissions_user_id_9a4c5204;
DROP INDEX IF EXISTS public.auth_users_user_permissions_permission_id_ed9ffa4c;
DROP INDEX IF EXISTS public.auth_users_university_id_17e6a682;
DROP INDEX IF EXISTS public.auth_users_role_f7b3b946_like;
DROP INDEX IF EXISTS public.auth_users_role_f7b3b946;
DROP INDEX IF EXISTS public.auth_users_phone_3747d037_like;
DROP INDEX IF EXISTS public.auth_users_is_active_d0ee75b1;
DROP INDEX IF EXISTS public.auth_users_groups_user_id_70322499;
DROP INDEX IF EXISTS public.auth_users_groups_group_id_0f75702f;
DROP INDEX IF EXISTS public.auth_users_email_d961f1be_like;
DROP INDEX IF EXISTS public.auth_users_deleted_at_6272b803;
DROP INDEX IF EXISTS public.auth_users_created_at_d7f6ffcb;
DROP INDEX IF EXISTS public.auth_user_verifications_user_id_e30039ee;
DROP INDEX IF EXISTS public.auth_user_verifications_status_79a6d819_like;
DROP INDEX IF EXISTS public.auth_user_verifications_status_79a6d819;
DROP INDEX IF EXISTS public.auth_user_verifications_reviewed_by_id_3125802c;
DROP INDEX IF EXISTS public.auth_user_verifications_deleted_at_f5ef3f09;
DROP INDEX IF EXISTS public.auth_user_verifications_created_at_5205d57f;
DROP INDEX IF EXISTS public.auth_user_sessions_user_id_fbf11f9e;
DROP INDEX IF EXISTS public.auth_user_sessions_token_hash_f29a1189_like;
DROP INDEX IF EXISTS public.auth_user_sessions_expires_at_244185fe;
DROP INDEX IF EXISTS public.auth_user_sessions_created_at_d55c6388;
DROP INDEX IF EXISTS public.auth_user_addresses_user_id_04f87b71;
DROP INDEX IF EXISTS public.auth_user_addresses_deleted_at_68937ed8;
DROP INDEX IF EXISTS public.auth_user_addresses_created_at_7cc1ad24;
DROP INDEX IF EXISTS public.auth_permission_content_type_id_2f476e4b;
DROP INDEX IF EXISTS public.auth_group_permissions_permission_id_84c5c92e;
DROP INDEX IF EXISTS public.auth_group_permissions_group_id_b120cbf9;
DROP INDEX IF EXISTS public.auth_group_name_a6ea08ec_like;
DROP INDEX IF EXISTS public.auth_email_verification_tokens_user_id_b858f3e8;
DROP INDEX IF EXISTS public.auth_email_verification_tokens_token_ba350b22_like;
ALTER TABLE IF EXISTS ONLY public.universities DROP CONSTRAINT IF EXISTS universities_system_id_key;
ALTER TABLE IF EXISTS ONLY public.universities DROP CONSTRAINT IF EXISTS universities_slug_key;
ALTER TABLE IF EXISTS ONLY public.universities DROP CONSTRAINT IF EXISTS universities_short_name_key;
ALTER TABLE IF EXISTS ONLY public.universities DROP CONSTRAINT IF EXISTS universities_pkey;
ALTER TABLE IF EXISTS ONLY public.universities DROP CONSTRAINT IF EXISTS universities_name_key;
ALTER TABLE IF EXISTS ONLY public.token_blacklist_outstandingtoken DROP CONSTRAINT IF EXISTS token_blacklist_outstandingtoken_pkey;
ALTER TABLE IF EXISTS ONLY public.token_blacklist_outstandingtoken DROP CONSTRAINT IF EXISTS token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_uniq;
ALTER TABLE IF EXISTS ONLY public.token_blacklist_blacklistedtoken DROP CONSTRAINT IF EXISTS token_blacklist_blacklistedtoken_token_id_key;
ALTER TABLE IF EXISTS ONLY public.token_blacklist_blacklistedtoken DROP CONSTRAINT IF EXISTS token_blacklist_blacklistedtoken_pkey;
ALTER TABLE IF EXISTS ONLY public.student_benefits DROP CONSTRAINT IF EXISTS student_benefits_pkey;
ALTER TABLE IF EXISTS ONLY public.stores DROP CONSTRAINT IF EXISTS stores_slug_key;
ALTER TABLE IF EXISTS ONLY public.stores DROP CONSTRAINT IF EXISTS stores_seller_id_key;
ALTER TABLE IF EXISTS ONLY public.stores DROP CONSTRAINT IF EXISTS stores_pkey;
ALTER TABLE IF EXISTS ONLY public.seller_profiles DROP CONSTRAINT IF EXISTS seller_profiles_user_id_key;
ALTER TABLE IF EXISTS ONLY public.seller_profiles DROP CONSTRAINT IF EXISTS seller_profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.seller_payout_requests DROP CONSTRAINT IF EXISTS seller_payout_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.seller_badges DROP CONSTRAINT IF EXISTS seller_badges_pkey;
ALTER TABLE IF EXISTS ONLY public.marketplace_reviews DROP CONSTRAINT IF EXISTS marketplace_reviews_product_id_reviewer_id_fea65bfb_uniq;
ALTER TABLE IF EXISTS ONLY public.marketplace_reviews DROP CONSTRAINT IF EXISTS marketplace_reviews_pkey;
ALTER TABLE IF EXISTS ONLY public.marketplace_reports DROP CONSTRAINT IF EXISTS marketplace_reports_product_id_reporter_id_ad464ef2_uniq;
ALTER TABLE IF EXISTS ONLY public.marketplace_reports DROP CONSTRAINT IF EXISTS marketplace_reports_pkey;
ALTER TABLE IF EXISTS ONLY public.marketplace_products DROP CONSTRAINT IF EXISTS marketplace_products_pkey;
ALTER TABLE IF EXISTS ONLY public.marketplace_product_images DROP CONSTRAINT IF EXISTS marketplace_product_images_pkey;
ALTER TABLE IF EXISTS ONLY public.marketplace_offers DROP CONSTRAINT IF EXISTS marketplace_offers_product_id_buyer_id_24855b3a_uniq;
ALTER TABLE IF EXISTS ONLY public.marketplace_offers DROP CONSTRAINT IF EXISTS marketplace_offers_pkey;
ALTER TABLE IF EXISTS ONLY public.marketplace_messages DROP CONSTRAINT IF EXISTS marketplace_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.marketplace_chats DROP CONSTRAINT IF EXISTS marketplace_chats_product_id_buyer_id_536ce863_uniq;
ALTER TABLE IF EXISTS ONLY public.marketplace_chats DROP CONSTRAINT IF EXISTS marketplace_chats_pkey;
ALTER TABLE IF EXISTS ONLY public.marketplace_categories DROP CONSTRAINT IF EXISTS marketplace_categories_slug_key;
ALTER TABLE IF EXISTS ONLY public.marketplace_categories DROP CONSTRAINT IF EXISTS marketplace_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.marketplace_categories DROP CONSTRAINT IF EXISTS marketplace_categories_name_ad_type_parent_id_1ef12e3b_uniq;
ALTER TABLE IF EXISTS ONLY public.django_session DROP CONSTRAINT IF EXISTS django_session_pkey;
ALTER TABLE IF EXISTS ONLY public.django_migrations DROP CONSTRAINT IF EXISTS django_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.django_content_type DROP CONSTRAINT IF EXISTS django_content_type_pkey;
ALTER TABLE IF EXISTS ONLY public.django_content_type DROP CONSTRAINT IF EXISTS django_content_type_app_label_model_76bd3d3b_uniq;
ALTER TABLE IF EXISTS ONLY public.django_celery_beat_solarschedule DROP CONSTRAINT IF EXISTS django_celery_beat_solarschedule_pkey;
ALTER TABLE IF EXISTS ONLY public.django_celery_beat_solarschedule DROP CONSTRAINT IF EXISTS django_celery_beat_solar_event_latitude_longitude_ba64999a_uniq;
ALTER TABLE IF EXISTS ONLY public.django_celery_beat_periodictasks DROP CONSTRAINT IF EXISTS django_celery_beat_periodictasks_pkey;
ALTER TABLE IF EXISTS ONLY public.django_celery_beat_periodictask DROP CONSTRAINT IF EXISTS django_celery_beat_periodictask_pkey;
ALTER TABLE IF EXISTS ONLY public.django_celery_beat_periodictask DROP CONSTRAINT IF EXISTS django_celery_beat_periodictask_name_key;
ALTER TABLE IF EXISTS ONLY public.django_celery_beat_intervalschedule DROP CONSTRAINT IF EXISTS django_celery_beat_intervalschedule_pkey;
ALTER TABLE IF EXISTS ONLY public.django_celery_beat_crontabschedule DROP CONSTRAINT IF EXISTS django_celery_beat_crontabschedule_pkey;
ALTER TABLE IF EXISTS ONLY public.django_celery_beat_clockedschedule DROP CONSTRAINT IF EXISTS django_celery_beat_clockedschedule_pkey;
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_users_user_permissions DROP CONSTRAINT IF EXISTS auth_users_user_permissions_user_id_permission_id_6cc07159_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_users_user_permissions DROP CONSTRAINT IF EXISTS auth_users_user_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_users DROP CONSTRAINT IF EXISTS auth_users_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_users DROP CONSTRAINT IF EXISTS auth_users_phone_key;
ALTER TABLE IF EXISTS ONLY public.auth_users_groups DROP CONSTRAINT IF EXISTS auth_users_groups_user_id_group_id_64a20d79_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_users_groups DROP CONSTRAINT IF EXISTS auth_users_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_users DROP CONSTRAINT IF EXISTS auth_users_email_key;
ALTER TABLE IF EXISTS ONLY public.auth_user_verifications DROP CONSTRAINT IF EXISTS auth_user_verifications_user_id_verification_type_3b12f131_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_user_verifications DROP CONSTRAINT IF EXISTS auth_user_verifications_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_user_sessions DROP CONSTRAINT IF EXISTS auth_user_sessions_token_hash_key;
ALTER TABLE IF EXISTS ONLY public.auth_user_sessions DROP CONSTRAINT IF EXISTS auth_user_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_user_addresses DROP CONSTRAINT IF EXISTS auth_user_addresses_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_content_type_id_codename_01ab375a_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_group DROP CONSTRAINT IF EXISTS auth_group_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_group_id_permission_id_0cd325b0_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_group DROP CONSTRAINT IF EXISTS auth_group_name_key;
ALTER TABLE IF EXISTS ONLY public.auth_email_verification_tokens DROP CONSTRAINT IF EXISTS auth_email_verification_tokens_token_key;
ALTER TABLE IF EXISTS ONLY public.auth_email_verification_tokens DROP CONSTRAINT IF EXISTS auth_email_verification_tokens_pkey;
DROP TABLE IF EXISTS public.universities;
DROP TABLE IF EXISTS public.token_blacklist_outstandingtoken;
DROP TABLE IF EXISTS public.token_blacklist_blacklistedtoken;
DROP TABLE IF EXISTS public.student_benefits;
DROP TABLE IF EXISTS public.stores;
DROP TABLE IF EXISTS public.seller_profiles;
DROP TABLE IF EXISTS public.seller_payout_requests;
DROP TABLE IF EXISTS public.seller_badges;
DROP TABLE IF EXISTS public.marketplace_reviews;
DROP TABLE IF EXISTS public.marketplace_reports;
DROP TABLE IF EXISTS public.marketplace_products;
DROP TABLE IF EXISTS public.marketplace_product_images;
DROP TABLE IF EXISTS public.marketplace_offers;
DROP TABLE IF EXISTS public.marketplace_messages;
DROP TABLE IF EXISTS public.marketplace_chats;
DROP TABLE IF EXISTS public.marketplace_categories;
DROP TABLE IF EXISTS public.django_session;
DROP TABLE IF EXISTS public.django_migrations;
DROP TABLE IF EXISTS public.django_content_type;
DROP TABLE IF EXISTS public.django_celery_beat_solarschedule;
DROP TABLE IF EXISTS public.django_celery_beat_periodictasks;
DROP TABLE IF EXISTS public.django_celery_beat_periodictask;
DROP TABLE IF EXISTS public.django_celery_beat_intervalschedule;
DROP TABLE IF EXISTS public.django_celery_beat_crontabschedule;
DROP TABLE IF EXISTS public.django_celery_beat_clockedschedule;
DROP TABLE IF EXISTS public.django_admin_log;
DROP TABLE IF EXISTS public.auth_users_user_permissions;
DROP TABLE IF EXISTS public.auth_users_groups;
DROP TABLE IF EXISTS public.auth_users;
DROP TABLE IF EXISTS public.auth_user_verifications;
DROP TABLE IF EXISTS public.auth_user_sessions;
DROP TABLE IF EXISTS public.auth_user_addresses;
DROP TABLE IF EXISTS public.auth_permission;
DROP TABLE IF EXISTS public.auth_group_permissions;
DROP TABLE IF EXISTS public.auth_group;
DROP TABLE IF EXISTS public.auth_email_verification_tokens;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auth_email_verification_tokens; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.auth_email_verification_tokens (
    id uuid NOT NULL,
    token character varying(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    is_used boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    user_id uuid NOT NULL
);


ALTER TABLE public.auth_email_verification_tokens OWNER TO campushat_user;

--
-- Name: auth_group; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);


ALTER TABLE public.auth_group OWNER TO campushat_user;

--
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: public; Owner: campushat_user
--

ALTER TABLE public.auth_group ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_group_permissions; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.auth_group_permissions (
    id bigint NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_group_permissions OWNER TO campushat_user;

--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: campushat_user
--

ALTER TABLE public.auth_group_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_permission; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);


ALTER TABLE public.auth_permission OWNER TO campushat_user;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: campushat_user
--

ALTER TABLE public.auth_permission ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_addresses; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.auth_user_addresses (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    label character varying(100) NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    campus_building character varying(100),
    room_number character varying(50),
    district character varying(80) NOT NULL,
    city character varying(100) NOT NULL,
    postal_code character varying(10) NOT NULL,
    is_default boolean NOT NULL,
    deleted_at timestamp with time zone,
    user_id uuid NOT NULL
);


ALTER TABLE public.auth_user_addresses OWNER TO campushat_user;

--
-- Name: auth_user_sessions; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.auth_user_sessions (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    token_hash character varying(255) NOT NULL,
    device_info character varying(300),
    ip_address inet,
    expires_at timestamp with time zone NOT NULL,
    revoked boolean NOT NULL,
    user_id uuid NOT NULL
);


ALTER TABLE public.auth_user_sessions OWNER TO campushat_user;

--
-- Name: auth_user_verifications; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.auth_user_verifications (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    verification_type character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    submitted_document_url character varying(500),
    student_id_number character varying(50),
    enrollment_cert_url character varying(500),
    verification_tier character varying(10) NOT NULL,
    rejection_reason text,
    valid_until date,
    deleted_at timestamp with time zone,
    reviewed_by_id uuid,
    user_id uuid NOT NULL
);


ALTER TABLE public.auth_user_verifications OWNER TO campushat_user;

--
-- Name: auth_users; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.auth_users (
    password character varying(128) NOT NULL,
    is_superuser boolean NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(20),
    full_name character varying(200) NOT NULL,
    profile_picture character varying(500),
    role character varying(20) NOT NULL,
    is_email_verified boolean NOT NULL,
    is_phone_verified boolean NOT NULL,
    is_active boolean NOT NULL,
    is_staff boolean NOT NULL,
    reputation_score numeric(5,2) NOT NULL,
    last_login timestamp with time zone,
    deleted_at timestamp with time zone,
    university_id uuid
);


ALTER TABLE public.auth_users OWNER TO campushat_user;

--
-- Name: auth_users_groups; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.auth_users_groups (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE public.auth_users_groups OWNER TO campushat_user;

--
-- Name: auth_users_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: campushat_user
--

ALTER TABLE public.auth_users_groups ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_users_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_users_user_permissions; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.auth_users_user_permissions (
    id bigint NOT NULL,
    user_id uuid NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_users_user_permissions OWNER TO campushat_user;

--
-- Name: auth_users_user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: campushat_user
--

ALTER TABLE public.auth_users_user_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_users_user_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_admin_log; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.django_admin_log (
    id integer NOT NULL,
    action_time timestamp with time zone NOT NULL,
    object_id text,
    object_repr character varying(200) NOT NULL,
    action_flag smallint NOT NULL,
    change_message text NOT NULL,
    content_type_id integer,
    user_id uuid NOT NULL,
    CONSTRAINT django_admin_log_action_flag_check CHECK ((action_flag >= 0))
);


ALTER TABLE public.django_admin_log OWNER TO campushat_user;

--
-- Name: django_admin_log_id_seq; Type: SEQUENCE; Schema: public; Owner: campushat_user
--

ALTER TABLE public.django_admin_log ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_admin_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_celery_beat_clockedschedule; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.django_celery_beat_clockedschedule (
    id integer NOT NULL,
    clocked_time timestamp with time zone NOT NULL
);


ALTER TABLE public.django_celery_beat_clockedschedule OWNER TO campushat_user;

--
-- Name: django_celery_beat_clockedschedule_id_seq; Type: SEQUENCE; Schema: public; Owner: campushat_user
--

ALTER TABLE public.django_celery_beat_clockedschedule ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_celery_beat_clockedschedule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_celery_beat_crontabschedule; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.django_celery_beat_crontabschedule (
    id integer NOT NULL,
    minute character varying(240) NOT NULL,
    hour character varying(96) NOT NULL,
    day_of_week character varying(64) NOT NULL,
    day_of_month character varying(124) NOT NULL,
    month_of_year character varying(64) NOT NULL,
    timezone character varying(63) NOT NULL
);


ALTER TABLE public.django_celery_beat_crontabschedule OWNER TO campushat_user;

--
-- Name: django_celery_beat_crontabschedule_id_seq; Type: SEQUENCE; Schema: public; Owner: campushat_user
--

ALTER TABLE public.django_celery_beat_crontabschedule ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_celery_beat_crontabschedule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_celery_beat_intervalschedule; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.django_celery_beat_intervalschedule (
    id integer NOT NULL,
    every integer NOT NULL,
    period character varying(24) NOT NULL
);


ALTER TABLE public.django_celery_beat_intervalschedule OWNER TO campushat_user;

--
-- Name: django_celery_beat_intervalschedule_id_seq; Type: SEQUENCE; Schema: public; Owner: campushat_user
--

ALTER TABLE public.django_celery_beat_intervalschedule ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_celery_beat_intervalschedule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_celery_beat_periodictask; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.django_celery_beat_periodictask (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    task character varying(200) NOT NULL,
    args text NOT NULL,
    kwargs text NOT NULL,
    queue character varying(200),
    exchange character varying(200),
    routing_key character varying(200),
    expires timestamp with time zone,
    enabled boolean NOT NULL,
    last_run_at timestamp with time zone,
    total_run_count integer NOT NULL,
    date_changed timestamp with time zone NOT NULL,
    description text NOT NULL,
    crontab_id integer,
    interval_id integer,
    solar_id integer,
    one_off boolean NOT NULL,
    start_time timestamp with time zone,
    priority integer,
    headers text NOT NULL,
    clocked_id integer,
    expire_seconds integer,
    CONSTRAINT django_celery_beat_periodictask_expire_seconds_check CHECK ((expire_seconds >= 0)),
    CONSTRAINT django_celery_beat_periodictask_priority_check CHECK ((priority >= 0)),
    CONSTRAINT django_celery_beat_periodictask_total_run_count_check CHECK ((total_run_count >= 0))
);


ALTER TABLE public.django_celery_beat_periodictask OWNER TO campushat_user;

--
-- Name: django_celery_beat_periodictask_id_seq; Type: SEQUENCE; Schema: public; Owner: campushat_user
--

ALTER TABLE public.django_celery_beat_periodictask ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_celery_beat_periodictask_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_celery_beat_periodictasks; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.django_celery_beat_periodictasks (
    ident smallint NOT NULL,
    last_update timestamp with time zone NOT NULL
);


ALTER TABLE public.django_celery_beat_periodictasks OWNER TO campushat_user;

--
-- Name: django_celery_beat_solarschedule; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.django_celery_beat_solarschedule (
    id integer NOT NULL,
    event character varying(24) NOT NULL,
    latitude numeric(9,6) NOT NULL,
    longitude numeric(9,6) NOT NULL
);


ALTER TABLE public.django_celery_beat_solarschedule OWNER TO campushat_user;

--
-- Name: django_celery_beat_solarschedule_id_seq; Type: SEQUENCE; Schema: public; Owner: campushat_user
--

ALTER TABLE public.django_celery_beat_solarschedule ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_celery_beat_solarschedule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_content_type; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);


ALTER TABLE public.django_content_type OWNER TO campushat_user;

--
-- Name: django_content_type_id_seq; Type: SEQUENCE; Schema: public; Owner: campushat_user
--

ALTER TABLE public.django_content_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_content_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_migrations; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.django_migrations (
    id bigint NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);


ALTER TABLE public.django_migrations OWNER TO campushat_user;

--
-- Name: django_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: campushat_user
--

ALTER TABLE public.django_migrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_session; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);


ALTER TABLE public.django_session OWNER TO campushat_user;

--
-- Name: marketplace_categories; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.marketplace_categories (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    name character varying(100) NOT NULL,
    slug character varying(120) NOT NULL,
    ad_type character varying(10) NOT NULL,
    icon_url character varying(300),
    sort_order integer NOT NULL,
    is_active boolean NOT NULL,
    parent_id uuid
);


ALTER TABLE public.marketplace_categories OWNER TO campushat_user;

--
-- Name: marketplace_chats; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.marketplace_chats (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    is_blocked boolean NOT NULL,
    last_message_at timestamp with time zone,
    buyer_id uuid NOT NULL,
    product_id uuid NOT NULL,
    seller_id uuid NOT NULL
);


ALTER TABLE public.marketplace_chats OWNER TO campushat_user;

--
-- Name: marketplace_messages; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.marketplace_messages (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    message_type character varying(15) NOT NULL,
    content text NOT NULL,
    is_read boolean NOT NULL,
    chat_id uuid NOT NULL,
    sender_id uuid NOT NULL
);


ALTER TABLE public.marketplace_messages OWNER TO campushat_user;

--
-- Name: marketplace_offers; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.marketplace_offers (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    offered_price numeric(10,2) NOT NULL,
    counter_price numeric(10,2),
    status character varying(15) NOT NULL,
    message text,
    expires_at timestamp with time zone NOT NULL,
    buyer_id uuid NOT NULL,
    product_id uuid NOT NULL
);


ALTER TABLE public.marketplace_offers OWNER TO campushat_user;

--
-- Name: marketplace_product_images; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.marketplace_product_images (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    image_url character varying(500) NOT NULL,
    sort_order integer NOT NULL,
    is_primary boolean NOT NULL,
    product_id uuid NOT NULL
);


ALTER TABLE public.marketplace_product_images OWNER TO campushat_user;

--
-- Name: marketplace_products; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.marketplace_products (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    post_type character varying(10) NOT NULL,
    price numeric(10,2) NOT NULL,
    price_unit character varying(30),
    condition character varying(15),
    is_negotiable boolean NOT NULL,
    campus_visibility character varying(20) NOT NULL,
    status character varying(10) NOT NULL,
    duration_days integer NOT NULL,
    expires_at timestamp with time zone,
    is_hidden_by_user boolean NOT NULL,
    is_auto_expired boolean NOT NULL,
    repost_count integer NOT NULL,
    rejection_reason text,
    safe_meetup_location character varying(200),
    view_count integer NOT NULL,
    category_id uuid,
    reviewed_by_id uuid,
    university_id uuid NOT NULL,
    user_id uuid NOT NULL
);


ALTER TABLE public.marketplace_products OWNER TO campushat_user;

--
-- Name: marketplace_reports; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.marketplace_reports (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    reason character varying(20) NOT NULL,
    description text,
    status character varying(15) NOT NULL,
    admin_note text,
    product_id uuid NOT NULL,
    reporter_id uuid NOT NULL,
    reviewed_by_id uuid
);


ALTER TABLE public.marketplace_reports OWNER TO campushat_user;

--
-- Name: marketplace_reviews; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.marketplace_reviews (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    rating smallint NOT NULL,
    comment text,
    is_verified_transaction boolean NOT NULL,
    product_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    CONSTRAINT marketplace_reviews_rating_check CHECK ((rating >= 0))
);


ALTER TABLE public.marketplace_reviews OWNER TO campushat_user;

--
-- Name: seller_badges; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.seller_badges (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    badge_type character varying(20) NOT NULL,
    display_label character varying(100) NOT NULL,
    is_active boolean NOT NULL,
    awarded_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    awarded_by_id uuid,
    store_id uuid NOT NULL
);


ALTER TABLE public.seller_badges OWNER TO campushat_user;

--
-- Name: seller_payout_requests; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.seller_payout_requests (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    amount numeric(10,2) NOT NULL,
    method character varying(10) NOT NULL,
    account_details_snapshot jsonb NOT NULL,
    status character varying(15) NOT NULL,
    bank_transaction_ref character varying(200),
    note text,
    processed_at timestamp with time zone,
    processed_by_id uuid,
    seller_id uuid NOT NULL
);


ALTER TABLE public.seller_payout_requests OWNER TO campushat_user;

--
-- Name: seller_profiles; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.seller_profiles (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    business_name character varying(200) NOT NULL,
    business_type character varying(20) NOT NULL,
    nid_number character varying(100),
    nid_front_url character varying(500),
    nid_back_url character varying(500),
    trade_license_url character varying(500),
    tin_cert_url character varying(500),
    vat_cert_url character varying(500),
    brand_auth_letter_url character varying(500),
    trademark_cert_url character varying(500),
    bank_account_details text,
    mobile_banking_method character varying(10),
    mobile_banking_number character varying(500),
    business_phone character varying(20) NOT NULL,
    business_email character varying(255),
    status character varying(15) NOT NULL,
    commission_rate numeric(5,2) NOT NULL,
    is_student_seller boolean NOT NULL,
    rejection_reason text,
    approved_by_id uuid,
    user_id uuid NOT NULL
);


ALTER TABLE public.seller_profiles OWNER TO campushat_user;

--
-- Name: stores; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.stores (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    name character varying(200) NOT NULL,
    slug character varying(220) NOT NULL,
    description text NOT NULL,
    logo_url character varying(500),
    banner_url character varying(500),
    store_category character varying(100) NOT NULL,
    return_policy text NOT NULL,
    avg_dispatch_hours integer NOT NULL,
    shipping_coverage text,
    business_phone character varying(20) NOT NULL,
    business_email character varying(255),
    status character varying(15) NOT NULL,
    rejection_reason text,
    rating_avg numeric(3,2) NOT NULL,
    review_count integer NOT NULL,
    total_sales_count integer NOT NULL,
    approved_by_id uuid,
    seller_id uuid NOT NULL,
    university_id uuid NOT NULL
);


ALTER TABLE public.stores OWNER TO campushat_user;

--
-- Name: student_benefits; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.student_benefits (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    benefit_type character varying(20) NOT NULL,
    discount_percentage numeric(5,2),
    valid_from date NOT NULL,
    valid_until date NOT NULL,
    is_active boolean NOT NULL,
    granted_by_id uuid NOT NULL,
    seller_id uuid NOT NULL
);


ALTER TABLE public.student_benefits OWNER TO campushat_user;

--
-- Name: token_blacklist_blacklistedtoken; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.token_blacklist_blacklistedtoken (
    id bigint NOT NULL,
    blacklisted_at timestamp with time zone NOT NULL,
    token_id bigint NOT NULL
);


ALTER TABLE public.token_blacklist_blacklistedtoken OWNER TO campushat_user;

--
-- Name: token_blacklist_blacklistedtoken_id_seq; Type: SEQUENCE; Schema: public; Owner: campushat_user
--

ALTER TABLE public.token_blacklist_blacklistedtoken ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.token_blacklist_blacklistedtoken_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: token_blacklist_outstandingtoken; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.token_blacklist_outstandingtoken (
    id bigint NOT NULL,
    token text NOT NULL,
    created_at timestamp with time zone,
    expires_at timestamp with time zone NOT NULL,
    user_id uuid,
    jti character varying(255) NOT NULL
);


ALTER TABLE public.token_blacklist_outstandingtoken OWNER TO campushat_user;

--
-- Name: token_blacklist_outstandingtoken_id_seq; Type: SEQUENCE; Schema: public; Owner: campushat_user
--

ALTER TABLE public.token_blacklist_outstandingtoken ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.token_blacklist_outstandingtoken_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: universities; Type: TABLE; Schema: public; Owner: campushat_user
--

CREATE TABLE public.universities (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    deleted_at timestamp with time zone,
    name character varying(200) NOT NULL,
    short_name character varying(20) NOT NULL,
    slug character varying(25) NOT NULL,
    system_id character varying(20) NOT NULL,
    division character varying(20) NOT NULL,
    district character varying(80) NOT NULL,
    postal_code character varying(10) NOT NULL,
    full_address text NOT NULL,
    short_description character varying(300),
    logo_url character varying(500),
    is_active boolean NOT NULL,
    sso_enabled boolean NOT NULL,
    sso_provider character varying(50),
    sso_domain character varying(100)
);


ALTER TABLE public.universities OWNER TO campushat_user;

--
-- Data for Name: auth_email_verification_tokens; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.auth_email_verification_tokens (id, token, expires_at, is_used, created_at, user_id) FROM stdin;
9b102a75-eb44-4f9c-8601-7b9b0e2c2212	RhxRPjV3NYH9WS0wsb87NSgg40Lp9wvqAQ4XPvSJdfdFDjfk6u9Q-izde7uvvUmh	2026-03-08 18:09:47.379141+00	t	2026-03-07 18:09:47.379451+00	f1caa6ab-460f-4153-8d30-482f97bdf5a2
7cd9c7c2-276f-42e2-8018-12a49cd1919a	SVFTtOV_7g-25jTvvn6FyRNFfhINDYQ3peRqA8XJLI5wclgHDxAT_bnPRlJzz1Zs	2026-03-08 18:11:14.786299+00	t	2026-03-07 18:11:14.786546+00	5ac308ca-5d55-474e-b17c-ce7f59f08cb6
1022e156-978e-4112-af97-71f38e1916d6	zQCFS_y7fpVeXtINZ0B5Ur7oyvpXLq-yWGpIfjWfmeZdemXan48CwrG2ifF8gpca	2026-03-08 18:14:54.444926+00	t	2026-03-07 18:14:54.445117+00	3a437219-75ff-45ad-a15a-d7fdc6963758
6e8e6fde-535f-4945-b912-ea7d21be474b	rgprPHvwl0edQ-juGcEVmz0q8WhrzWrtBJM1ZNN6AZRC_PUn3d2W3mry2wGZk1iz	2026-03-08 18:15:37.801007+00	t	2026-03-07 18:15:37.801212+00	eb672a36-afff-4655-9fd5-4aabe525505d
\.


--
-- Data for Name: auth_group; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.auth_group (id, name) FROM stdin;
\.


--
-- Data for Name: auth_group_permissions; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.auth_group_permissions (id, group_id, permission_id) FROM stdin;
\.


--
-- Data for Name: auth_permission; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.auth_permission (id, name, content_type_id, codename) FROM stdin;
1	Can add log entry	1	add_logentry
2	Can change log entry	1	change_logentry
3	Can delete log entry	1	delete_logentry
4	Can view log entry	1	view_logentry
5	Can add permission	2	add_permission
6	Can change permission	2	change_permission
7	Can delete permission	2	delete_permission
8	Can view permission	2	view_permission
9	Can add group	3	add_group
10	Can change group	3	change_group
11	Can delete group	3	delete_group
12	Can view group	3	view_group
13	Can add content type	4	add_contenttype
14	Can change content type	4	change_contenttype
15	Can delete content type	4	delete_contenttype
16	Can view content type	4	view_contenttype
17	Can add session	5	add_session
18	Can change session	5	change_session
19	Can delete session	5	delete_session
20	Can view session	5	view_session
21	Can add blacklisted token	6	add_blacklistedtoken
22	Can change blacklisted token	6	change_blacklistedtoken
23	Can delete blacklisted token	6	delete_blacklistedtoken
24	Can view blacklisted token	6	view_blacklistedtoken
25	Can add outstanding token	7	add_outstandingtoken
26	Can change outstanding token	7	change_outstandingtoken
27	Can delete outstanding token	7	delete_outstandingtoken
28	Can view outstanding token	7	view_outstandingtoken
29	Can add crontab	8	add_crontabschedule
30	Can change crontab	8	change_crontabschedule
31	Can delete crontab	8	delete_crontabschedule
32	Can view crontab	8	view_crontabschedule
33	Can add interval	9	add_intervalschedule
34	Can change interval	9	change_intervalschedule
35	Can delete interval	9	delete_intervalschedule
36	Can view interval	9	view_intervalschedule
37	Can add periodic task	10	add_periodictask
38	Can change periodic task	10	change_periodictask
39	Can delete periodic task	10	delete_periodictask
40	Can view periodic task	10	view_periodictask
41	Can add periodic tasks	11	add_periodictasks
42	Can change periodic tasks	11	change_periodictasks
43	Can delete periodic tasks	11	delete_periodictasks
44	Can view periodic tasks	11	view_periodictasks
45	Can add solar event	12	add_solarschedule
46	Can change solar event	12	change_solarschedule
47	Can delete solar event	12	delete_solarschedule
48	Can view solar event	12	view_solarschedule
49	Can add clocked	13	add_clockedschedule
50	Can change clocked	13	change_clockedschedule
51	Can delete clocked	13	delete_clockedschedule
52	Can view clocked	13	view_clockedschedule
53	Can add University	14	add_university
54	Can change University	14	change_university
55	Can delete University	14	delete_university
56	Can view University	14	view_university
57	Can add User	15	add_user
58	Can change User	15	change_user
59	Can delete User	15	delete_user
60	Can view User	15	view_user
61	Can add Email Verification Token	16	add_emailverificationtoken
62	Can change Email Verification Token	16	change_emailverificationtoken
63	Can delete Email Verification Token	16	delete_emailverificationtoken
64	Can view Email Verification Token	16	view_emailverificationtoken
65	Can add User Verification	17	add_userverification
66	Can change User Verification	17	change_userverification
67	Can delete User Verification	17	delete_userverification
68	Can view User Verification	17	view_userverification
69	Can add User Session	18	add_usersession
70	Can change User Session	18	change_usersession
71	Can delete User Session	18	delete_usersession
72	Can view User Session	18	view_usersession
73	Can add User Address	19	add_useraddress
74	Can change User Address	19	change_useraddress
75	Can delete User Address	19	delete_useraddress
76	Can view User Address	19	view_useraddress
77	Can add marketplace category	20	add_marketplacecategory
78	Can change marketplace category	20	change_marketplacecategory
79	Can delete marketplace category	20	delete_marketplacecategory
80	Can view marketplace category	20	view_marketplacecategory
81	Can add marketplace product	21	add_marketplaceproduct
82	Can change marketplace product	21	change_marketplaceproduct
83	Can delete marketplace product	21	delete_marketplaceproduct
84	Can view marketplace product	21	view_marketplaceproduct
85	Can add marketplace product image	22	add_marketplaceproductimage
86	Can change marketplace product image	22	change_marketplaceproductimage
87	Can delete marketplace product image	22	delete_marketplaceproductimage
88	Can view marketplace product image	22	view_marketplaceproductimage
89	Can add marketplace offer	23	add_marketplaceoffer
90	Can change marketplace offer	23	change_marketplaceoffer
91	Can delete marketplace offer	23	delete_marketplaceoffer
92	Can view marketplace offer	23	view_marketplaceoffer
93	Can add marketplace chat	24	add_marketplacechat
94	Can change marketplace chat	24	change_marketplacechat
95	Can delete marketplace chat	24	delete_marketplacechat
96	Can view marketplace chat	24	view_marketplacechat
97	Can add marketplace message	25	add_marketplacemessage
98	Can change marketplace message	25	change_marketplacemessage
99	Can delete marketplace message	25	delete_marketplacemessage
100	Can view marketplace message	25	view_marketplacemessage
101	Can add marketplace review	26	add_marketplacereview
102	Can change marketplace review	26	change_marketplacereview
103	Can delete marketplace review	26	delete_marketplacereview
104	Can view marketplace review	26	view_marketplacereview
105	Can add marketplace report	27	add_marketplacereport
106	Can change marketplace report	27	change_marketplacereport
107	Can delete marketplace report	27	delete_marketplacereport
108	Can view marketplace report	27	view_marketplacereport
109	Can add seller profile	28	add_sellerprofile
110	Can change seller profile	28	change_sellerprofile
111	Can delete seller profile	28	delete_sellerprofile
112	Can view seller profile	28	view_sellerprofile
113	Can add store	29	add_store
114	Can change store	29	change_store
115	Can delete store	29	delete_store
116	Can view store	29	view_store
117	Can add seller badge	30	add_sellerbadge
118	Can change seller badge	30	change_sellerbadge
119	Can delete seller badge	30	delete_sellerbadge
120	Can view seller badge	30	view_sellerbadge
121	Can add seller payout request	31	add_sellerpayoutrequest
122	Can change seller payout request	31	change_sellerpayoutrequest
123	Can delete seller payout request	31	delete_sellerpayoutrequest
124	Can view seller payout request	31	view_sellerpayoutrequest
125	Can add student benefit	32	add_studentbenefit
126	Can change student benefit	32	change_studentbenefit
127	Can delete student benefit	32	delete_studentbenefit
128	Can view student benefit	32	view_studentbenefit
\.


--
-- Data for Name: auth_user_addresses; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.auth_user_addresses (id, created_at, updated_at, label, address_line1, address_line2, campus_building, room_number, district, city, postal_code, is_default, deleted_at, user_id) FROM stdin;
44cd888c-6460-436a-9078-31dd4e632f63	2026-03-07 19:37:10.589798+00	2026-03-07 19:37:10.589809+00	Home	123 Main	\N	\N	\N	Dhaka	Dhaka	1200	f	\N	05d7e76b-7bfa-4fe3-a33b-3a189a1f61ca
\.


--
-- Data for Name: auth_user_sessions; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.auth_user_sessions (id, created_at, updated_at, token_hash, device_info, ip_address, expires_at, revoked, user_id) FROM stdin;
fb51d2be-149e-4f17-8fc2-31ebf936570e	2026-03-07 19:37:09.626586+00	2026-03-07 19:37:09.626597+00	66bee2f447c21a8cbcaa1295ba928c35f77a7a2b46a2f7b620a9a671c3ac1183	Python-urllib/3.11	127.0.0.1	2026-03-07 19:52:09.626308+00	f	05d7e76b-7bfa-4fe3-a33b-3a189a1f61ca
37fb0d34-8300-44ce-a1a9-eb10a51e8502	2026-03-07 19:37:09.995947+00	2026-03-07 19:37:09.995959+00	b9b46d710a483be46637993fe209785c138be5c686114b8b94cc23164f88122d	Python-urllib/3.11	127.0.0.1	2026-03-07 19:52:09.995773+00	f	b63ac1c9-8036-4e34-b4ad-245b649cfb8e
51604dbb-6407-4cb1-a2bf-b6c091f9d9e8	2026-03-07 20:24:01.78034+00	2026-03-07 20:24:01.780352+00	f787bd1615011a04abf136927f6675faa9bbe87652d19a97f41f09256f28da7a	Python-urllib/3.11	127.0.0.1	2026-03-07 20:39:01.780083+00	f	fc34e851-e135-48b2-bc3d-f7e038e6bce9
98a4e103-a774-4704-b301-b4f9f2e32f57	2026-03-07 20:24:02.174901+00	2026-03-07 20:24:02.174915+00	f2a4177298da59d84df5d51d8d3364d86e989dd3988a9cae0eb1c32a0351198e	Python-urllib/3.11	127.0.0.1	2026-03-07 20:39:02.174641+00	f	e84721af-b7d3-4dfe-967b-290529c46e33
0c2230b5-89d8-474b-b9c6-394a57c23c37	2026-03-07 20:24:02.52167+00	2026-03-07 20:24:02.521679+00	b7b9d652b84e87d510ce8917ad69a7ee57babef9dd3b2294dacd594dba09ab93	Python-urllib/3.11	127.0.0.1	2026-03-07 20:39:02.521492+00	f	05ce91f1-9443-4d70-b3a0-131758b578b3
821ab44b-2541-43b5-b89d-1e07634482ba	2026-03-07 20:38:51.110221+00	2026-03-07 20:38:51.110233+00	be825a9b5067295ffaa2d1162b7df4eb0bb7dd6f51688f5be3d415c6826631cb	Python-urllib/3.11	127.0.0.1	2026-03-07 20:53:51.109966+00	f	9a4276aa-d124-4347-bf71-9fa2d9719607
25b8df33-4f24-43c2-b3b8-7704fb8bdb4a	2026-03-07 20:38:51.469043+00	2026-03-07 20:38:51.469055+00	07e1ed58ec921a811b1db873b2d63ae7667a3f7608718551058243988f66c473	Python-urllib/3.11	127.0.0.1	2026-03-07 20:53:51.46887+00	f	dac84bbf-978d-4eb7-8e0e-dd17915d31ee
3a6b0955-e5ea-4ae9-a5a0-f6b71823aa2f	2026-03-07 20:38:51.802416+00	2026-03-07 20:38:51.802424+00	81fed62f17b3ea49fccbd04420594b534675a3562920d2d184e4bda41cc724a2	Python-urllib/3.11	127.0.0.1	2026-03-07 20:53:51.802247+00	f	1e5afbf8-d172-493c-92e7-2a4cc9925f5d
fce1892d-1e09-465b-97b0-c23fc4fc3839	2026-03-07 21:09:35.301133+00	2026-03-07 21:09:35.301145+00	5e7a22a611e70a86547475aa55c85653da7b144d27705159eb945711f618af7c	Python-urllib/3.11	127.0.0.1	2026-03-07 21:24:35.300861+00	f	cee37380-4017-452e-be41-e85c7dd95c40
c68391c3-fb5d-4f29-8277-139bbc5148f6	2026-03-07 21:09:35.680897+00	2026-03-07 21:09:35.680909+00	441dc222fceb10a529896e9d1d03d643d7d41cdb10f5be5800a95224e06ad969	Python-urllib/3.11	127.0.0.1	2026-03-07 21:24:35.680719+00	f	9d26ee33-2918-4da6-ab87-3431c782c422
\.


--
-- Data for Name: auth_user_verifications; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.auth_user_verifications (id, created_at, updated_at, verification_type, status, submitted_document_url, student_id_number, enrollment_cert_url, verification_tier, rejection_reason, valid_until, deleted_at, reviewed_by_id, user_id) FROM stdin;
edce1ee4-f39c-4eb4-8018-7a0e80f1d6f4	2026-03-07 19:37:10.129597+00	2026-03-07 19:37:10.428915+00	student_id	approved	test/doc.jpg	STU-001	\N	silver	\N	2027-03-07	\N	b63ac1c9-8036-4e34-b4ad-245b649cfb8e	05d7e76b-7bfa-4fe3-a33b-3a189a1f61ca
cc996954-ab81-4db6-bcaf-f05ca5b2cd9a	2026-03-07 20:24:01.07393+00	2026-03-07 20:24:01.073939+00	student_id	approved	\N	STU-P4	\N	bronze	\N	\N	\N	\N	fc34e851-e135-48b2-bc3d-f7e038e6bce9
00e45464-5f24-4626-a2ca-7a76468e8594	2026-03-07 20:24:01.082148+00	2026-03-07 20:24:01.082158+00	student_id	approved	\N	STU-P4B	\N	bronze	\N	\N	\N	\N	05ce91f1-9443-4d70-b3a0-131758b578b3
a3ee7626-b2f7-4a7b-9474-888d1dd44d88	2026-03-07 20:38:50.476113+00	2026-03-07 20:38:50.476124+00	student_id	approved	\N	STX1	\N	bronze	\N	\N	\N	\N	9a4276aa-d124-4347-bf71-9fa2d9719607
a899407f-209d-4466-bee5-1d0264b50212	2026-03-07 20:38:50.480649+00	2026-03-07 20:38:50.48066+00	student_id	approved	\N	STX2	\N	bronze	\N	\N	\N	\N	1e5afbf8-d172-493c-92e7-2a4cc9925f5d
6eedb997-5bce-40e9-9272-3fcf3296db01	2026-03-07 21:09:34.571758+00	2026-03-07 21:09:34.57177+00	student_id	approved	\N	STU-P5	\N	bronze	\N	\N	\N	\N	cee37380-4017-452e-be41-e85c7dd95c40
\.


--
-- Data for Name: auth_users; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.auth_users (password, is_superuser, id, created_at, updated_at, email, phone, full_name, profile_picture, role, is_email_verified, is_phone_verified, is_active, is_staff, reputation_score, last_login, deleted_at, university_id) FROM stdin;
pbkdf2_sha256$600000$4b47q9IvWiBOrYGFLdkTKD$P5gKWr63WlBOxhdjvhcIjvxJ4msHo+Io520AZk7VQQw=	f	f1caa6ab-460f-4153-8d30-482f97bdf5a2	2026-03-07 18:09:47.36328+00	2026-03-07 18:09:47.363294+00	student@diu.edu.bd	\N	Mahedi Hasan	\N	student	t	f	t	f	0.00	\N	\N	f43395fb-fa27-40c3-a07e-a89225f999f9
pbkdf2_sha256$600000$D9Uzn3Eh1qYcgTuhR5VhFM$zZJX/JMp9P6PjOKA7Yhyqv4QV6Oj3zXaHYop52ZeOO8=	f	5ac308ca-5d55-474e-b17c-ce7f59f08cb6	2026-03-07 18:11:14.76856+00	2026-03-07 18:11:14.768574+00	freshtest@diu.edu.bd	\N	Fresh Test User	\N	student	t	f	t	f	0.00	\N	\N	f43395fb-fa27-40c3-a07e-a89225f999f9
pbkdf2_sha256$600000$06uvq19dZcYzLpEEpE3iQk$FXUx99UL/Sl608IeChJbJTxHdKYwXYuR+zo/5rKt540=	f	3a437219-75ff-45ad-a15a-d7fdc6963758	2026-03-07 18:14:54.434398+00	2026-03-07 18:14:54.434411+00	debug@test.com	\N	Debug	\N	student	t	f	t	f	0.00	\N	\N	f43395fb-fa27-40c3-a07e-a89225f999f9
pbkdf2_sha256$600000$ogXXsnNT0M23heqmMbdXVl$JklCzKD8bfKNzcD31JQbpROMdgqlKfttY6btlJplrvI=	f	eb672a36-afff-4655-9fd5-4aabe525505d	2026-03-07 18:15:37.788643+00	2026-03-07 18:15:37.788655+00	final@test.com	\N	Final Test	\N	student	t	f	t	f	0.00	\N	\N	f43395fb-fa27-40c3-a07e-a89225f999f9
pbkdf2_sha256$600000$lC6LzGcIglAPKSMxXyvImj$captbbANKOrvNb4xul5C99uTN+Pp7qe8C+3O9Lj+MLU=	t	88951559-2227-4ea0-b399-97dd0d7acad9	2026-03-07 18:07:00.479714+00	2026-03-07 18:07:00.479731+00	admin@campushat.com	\N	Admin User	\N	admin	t	f	t	t	0.00	2026-03-07 18:27:33.635506+00	\N	\N
pbkdf2_sha256$600000$nE96lB8OfX7CE7K6yDacHo$sdbRWjWd6MIifZe3Sf0Dd0XpUAPKfWI8xCwX46b4dTw=	f	b63ac1c9-8036-4e34-b4ad-245b649cfb8e	2026-03-07 19:37:09.022552+00	2026-03-07 19:37:09.022566+00	p3admin@test.com	\N	P3 Admin	\N	admin	t	f	t	t	0.00	\N	\N	f43395fb-fa27-40c3-a07e-a89225f999f9
pbkdf2_sha256$600000$c5LFfAgNZwp8lgRkcxv8gr$oVhgCL32shvmt2HSTRSMlPibLbovUvjbtjTh5azOno4=	f	05d7e76b-7bfa-4fe3-a33b-3a189a1f61ca	2026-03-07 19:37:08.748568+00	2026-03-07 19:37:08.748585+00	p3test@test.com	\N	P3 Test	\N	student	t	f	t	f	20.00	\N	\N	f43395fb-fa27-40c3-a07e-a89225f999f9
pbkdf2_sha256$600000$FG35qv76Gm1vA6U151nhDT$++i1zl4XNw2eh9IhR8eCTlYAwwt9iaF9x7/16xmgP7Y=	f	e84721af-b7d3-4dfe-967b-290529c46e33	2026-03-07 20:24:00.808599+00	2026-03-07 20:24:00.808611+00	p4admin@test.com	\N	P4 Admin	\N	admin	t	f	t	t	0.00	\N	\N	f43395fb-fa27-40c3-a07e-a89225f999f9
pbkdf2_sha256$600000$HCgrmcGFVLCaZoSvGdINpp$EwYV0SLkZKgJs5S17jn1HOPFj1mkZrbksxYvRNe01v8=	f	fc34e851-e135-48b2-bc3d-f7e038e6bce9	2026-03-07 20:24:00.528463+00	2026-03-07 20:24:00.52848+00	p4student@test.com	\N	P4 Student	\N	student	t	f	t	f	10.00	\N	\N	f43395fb-fa27-40c3-a07e-a89225f999f9
pbkdf2_sha256$600000$GpxvWChPQ2WrYMBXiptYTa$ut7udU2wQ3lLy+lX12To6s+VjKvKotMw4y751oT237c=	f	05ce91f1-9443-4d70-b3a0-131758b578b3	2026-03-07 20:24:01.071485+00	2026-03-07 20:24:01.071498+00	p4buyer@test.com	\N	P4 Buyer	\N	student	t	f	t	f	10.00	\N	\N	f43395fb-fa27-40c3-a07e-a89225f999f9
pbkdf2_sha256$600000$lNSSx2K0y5lq2m9BblzXVB$9gVU235NWTNIqlh2y8pCWWM0gCZ9PFQ7Dfit8WEcr1o=	f	dac84bbf-978d-4eb7-8e0e-dd17915d31ee	2026-03-07 20:38:50.211536+00	2026-03-07 20:38:50.211548+00	p4xa@test.com	\N	P4 Admin	\N	admin	t	f	t	t	0.00	\N	\N	f43395fb-fa27-40c3-a07e-a89225f999f9
pbkdf2_sha256$600000$px9DHmrFdgrdDVCBTVpcCA$3WtTKR1UsPcUY2x/dHDDEoOKUbcZUddQv1RlNkZVrzE=	f	9a4276aa-d124-4347-bf71-9fa2d9719607	2026-03-07 20:38:49.938806+00	2026-03-07 20:38:49.938825+00	p4xs@test.com	\N	P4 Student	\N	student	t	f	t	f	10.00	\N	\N	f43395fb-fa27-40c3-a07e-a89225f999f9
pbkdf2_sha256$600000$tvxyLpDT6fZUwEIvpct4b9$d+hnw9xnI7b7sRi3sW/N0AwtI6YwH6stO38vOysRuyE=	f	1e5afbf8-d172-493c-92e7-2a4cc9925f5d	2026-03-07 20:38:50.473426+00	2026-03-07 20:38:50.473438+00	p4xb@test.com	\N	P4 Buyer	\N	student	t	f	t	f	10.00	\N	\N	f43395fb-fa27-40c3-a07e-a89225f999f9
pbkdf2_sha256$600000$sMIpoYR1gR2O91Co2v7q7t$MjEnlTSr6z7DRAfKhj9nz+v0anm37YyvIO21qPukyWY=	f	9d26ee33-2918-4da6-ab87-3431c782c422	2026-03-07 21:09:34.567412+00	2026-03-07 21:09:34.567426+00	p5xa@test.com	\N	P5 Admin	\N	admin	t	f	t	t	0.00	\N	\N	f43395fb-fa27-40c3-a07e-a89225f999f9
pbkdf2_sha256$600000$O11H6WrQH4vqV2u7p1knCa$u8XRYNUwBDXF/QhkpYwdj186lGLs14Yel7bmKgs5J3k=	f	cee37380-4017-452e-be41-e85c7dd95c40	2026-03-07 21:09:34.293166+00	2026-03-07 21:09:34.293184+00	p5xs@test.com	\N	P5 Student Seller	\N	student	t	f	t	f	10.00	\N	\N	f43395fb-fa27-40c3-a07e-a89225f999f9
\.


--
-- Data for Name: auth_users_groups; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.auth_users_groups (id, user_id, group_id) FROM stdin;
\.


--
-- Data for Name: auth_users_user_permissions; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.auth_users_user_permissions (id, user_id, permission_id) FROM stdin;
\.


--
-- Data for Name: django_admin_log; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.django_admin_log (id, action_time, object_id, object_repr, action_flag, change_message, content_type_id, user_id) FROM stdin;
\.


--
-- Data for Name: django_celery_beat_clockedschedule; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.django_celery_beat_clockedschedule (id, clocked_time) FROM stdin;
\.


--
-- Data for Name: django_celery_beat_crontabschedule; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.django_celery_beat_crontabschedule (id, minute, hour, day_of_week, day_of_month, month_of_year, timezone) FROM stdin;
1	0	4	*	*	*	Asia/Dhaka
\.


--
-- Data for Name: django_celery_beat_intervalschedule; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.django_celery_beat_intervalschedule (id, every, period) FROM stdin;
\.


--
-- Data for Name: django_celery_beat_periodictask; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.django_celery_beat_periodictask (id, name, task, args, kwargs, queue, exchange, routing_key, expires, enabled, last_run_at, total_run_count, date_changed, description, crontab_id, interval_id, solar_id, one_off, start_time, priority, headers, clocked_id, expire_seconds) FROM stdin;
1	celery.backend_cleanup	celery.backend_cleanup	[]	{}	\N	\N	\N	\N	t	\N	0	2026-03-07 21:09:24.884423+00		1	\N	\N	f	\N	\N	{}	\N	43200
\.


--
-- Data for Name: django_celery_beat_periodictasks; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.django_celery_beat_periodictasks (ident, last_update) FROM stdin;
1	2026-03-07 21:09:24.885379+00
\.


--
-- Data for Name: django_celery_beat_solarschedule; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.django_celery_beat_solarschedule (id, event, latitude, longitude) FROM stdin;
\.


--
-- Data for Name: django_content_type; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.django_content_type (id, app_label, model) FROM stdin;
1	admin	logentry
2	auth	permission
3	auth	group
4	contenttypes	contenttype
5	sessions	session
6	token_blacklist	blacklistedtoken
7	token_blacklist	outstandingtoken
8	django_celery_beat	crontabschedule
9	django_celery_beat	intervalschedule
10	django_celery_beat	periodictask
11	django_celery_beat	periodictasks
12	django_celery_beat	solarschedule
13	django_celery_beat	clockedschedule
14	universities	university
15	authentication	user
16	authentication	emailverificationtoken
17	authentication	userverification
18	authentication	usersession
19	authentication	useraddress
20	marketplace	marketplacecategory
21	marketplace	marketplaceproduct
22	marketplace	marketplaceproductimage
23	marketplace	marketplaceoffer
24	marketplace	marketplacechat
25	marketplace	marketplacemessage
26	marketplace	marketplacereview
27	marketplace	marketplacereport
28	sellers	sellerprofile
29	sellers	store
30	sellers	sellerbadge
31	sellers	sellerpayoutrequest
32	sellers	studentbenefit
\.


--
-- Data for Name: django_migrations; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.django_migrations (id, app, name, applied) FROM stdin;
1	contenttypes	0001_initial	2026-03-07 18:05:46.428042+00
2	universities	0001_initial	2026-03-07 18:05:46.50544+00
3	contenttypes	0002_remove_content_type_name	2026-03-07 18:05:46.514659+00
4	auth	0001_initial	2026-03-07 18:05:46.581793+00
5	auth	0002_alter_permission_name_max_length	2026-03-07 18:05:46.589138+00
6	auth	0003_alter_user_email_max_length	2026-03-07 18:05:46.595977+00
7	auth	0004_alter_user_username_opts	2026-03-07 18:05:46.60292+00
8	auth	0005_alter_user_last_login_null	2026-03-07 18:05:46.609539+00
9	auth	0006_require_contenttypes_0002	2026-03-07 18:05:46.613796+00
10	auth	0007_alter_validators_add_error_messages	2026-03-07 18:05:46.621374+00
11	auth	0008_alter_user_username_max_length	2026-03-07 18:05:46.628047+00
12	auth	0009_alter_user_last_name_max_length	2026-03-07 18:05:46.635315+00
13	auth	0010_alter_group_name_max_length	2026-03-07 18:05:46.644254+00
14	auth	0011_update_proxy_permissions	2026-03-07 18:05:46.651741+00
15	auth	0012_alter_user_first_name_max_length	2026-03-07 18:05:46.658203+00
16	authentication	0001_initial	2026-03-07 18:05:46.817652+00
17	admin	0001_initial	2026-03-07 18:05:46.853697+00
18	admin	0002_logentry_remove_auto_add	2026-03-07 18:05:46.863057+00
19	admin	0003_logentry_add_action_flag_choices	2026-03-07 18:05:46.872206+00
20	django_celery_beat	0001_initial	2026-03-07 18:05:46.934575+00
21	django_celery_beat	0002_auto_20161118_0346	2026-03-07 18:05:46.955403+00
22	django_celery_beat	0003_auto_20161209_0049	2026-03-07 18:05:46.968258+00
23	django_celery_beat	0004_auto_20170221_0000	2026-03-07 18:05:46.974499+00
24	django_celery_beat	0005_add_solarschedule_events_choices	2026-03-07 18:05:46.980575+00
25	django_celery_beat	0006_auto_20180322_0932	2026-03-07 18:05:47.012533+00
26	django_celery_beat	0007_auto_20180521_0826	2026-03-07 18:05:47.050255+00
27	django_celery_beat	0008_auto_20180914_1922	2026-03-07 18:05:47.072517+00
28	django_celery_beat	0006_auto_20180210_1226	2026-03-07 18:05:47.088998+00
29	django_celery_beat	0006_periodictask_priority	2026-03-07 18:05:47.099874+00
30	django_celery_beat	0009_periodictask_headers	2026-03-07 18:05:47.111283+00
31	django_celery_beat	0010_auto_20190429_0326	2026-03-07 18:05:47.232836+00
32	django_celery_beat	0011_auto_20190508_0153	2026-03-07 18:05:47.257439+00
33	django_celery_beat	0012_periodictask_expire_seconds	2026-03-07 18:05:47.267232+00
34	django_celery_beat	0013_auto_20200609_0727	2026-03-07 18:05:47.277207+00
35	django_celery_beat	0014_remove_clockedschedule_enabled	2026-03-07 18:05:47.283903+00
36	django_celery_beat	0015_edit_solarschedule_events_choices	2026-03-07 18:05:47.290302+00
37	django_celery_beat	0016_alter_crontabschedule_timezone	2026-03-07 18:05:47.300701+00
38	django_celery_beat	0017_alter_crontabschedule_month_of_year	2026-03-07 18:05:47.309321+00
39	django_celery_beat	0018_improve_crontab_helptext	2026-03-07 18:05:47.31779+00
40	sessions	0001_initial	2026-03-07 18:05:47.344675+00
41	token_blacklist	0001_initial	2026-03-07 18:05:47.400568+00
42	token_blacklist	0002_outstandingtoken_jti_hex	2026-03-07 18:05:47.411979+00
43	token_blacklist	0003_auto_20171017_2007	2026-03-07 18:05:47.436014+00
44	token_blacklist	0004_auto_20171017_2013	2026-03-07 18:05:47.458167+00
45	token_blacklist	0005_remove_outstandingtoken_jti	2026-03-07 18:05:47.470947+00
46	token_blacklist	0006_auto_20171017_2113	2026-03-07 18:05:47.48611+00
47	token_blacklist	0007_auto_20171017_2214	2026-03-07 18:05:47.522942+00
48	token_blacklist	0008_migrate_to_bigautofield	2026-03-07 18:05:47.599964+00
49	token_blacklist	0010_fix_migrate_to_bigautofield	2026-03-07 18:05:47.614884+00
50	token_blacklist	0011_linearizes_history	2026-03-07 18:05:47.619511+00
51	token_blacklist	0012_alter_outstandingtoken_user	2026-03-07 18:05:47.631559+00
52	authentication	0002_usersession_useraddress_userverification	2026-03-07 19:36:23.687519+00
53	marketplace	0001_initial	2026-03-07 20:22:48.872268+00
54	sellers	0001_initial	2026-03-07 21:06:24.990041+00
\.


--
-- Data for Name: django_session; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.django_session (session_key, session_data, expire_date) FROM stdin;
yu40h3x3nbz6lchlx41m0oke3ktiduf4	.eJxVjUsOwjAMBe-SNa3i_M0SiXNUTmzUCCgVaVeIu0OlLmA9b-a91EDrMg5rk-dQWR1VSujBe-yMMbFzQrrLFrHDyKw5UiFGdfjVMpWrTJtL89z6Dci01EJLfUz9Tlt_vlO9nfbtX2CkNm42piCFLpSD5iLWmu95ytkDFadBoxUPKWTjnABowCAmgg3aJ_BMrN4f5CxAvQ:1vywNB:HHcEuSe_UwWWJlQkiWVrrAoOMrG1WYQgTgI33xutGeo	2026-03-21 18:27:33.640756+00
\.


--
-- Data for Name: marketplace_categories; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.marketplace_categories (id, created_at, updated_at, deleted_at, name, slug, ad_type, icon_url, sort_order, is_active, parent_id) FROM stdin;
7594b16b-1911-4ea7-a2b5-951436b55821	2026-03-07 20:38:51.840449+00	2026-03-07 20:38:51.84046+00	\N	Electronics	sell-electronics	sell	\N	0	t	\N
\.


--
-- Data for Name: marketplace_chats; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.marketplace_chats (id, created_at, updated_at, deleted_at, is_blocked, last_message_at, buyer_id, product_id, seller_id) FROM stdin;
3f77e3ef-7724-4ad7-8843-9899a0da93e9	2026-03-07 20:38:52.335724+00	2026-03-07 20:38:52.335736+00	\N	f	\N	1e5afbf8-d172-493c-92e7-2a4cc9925f5d	8d1d3718-2d1d-47c7-803a-3a0374f85595	9a4276aa-d124-4347-bf71-9fa2d9719607
\.


--
-- Data for Name: marketplace_messages; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.marketplace_messages (id, created_at, updated_at, message_type, content, is_read, chat_id, sender_id) FROM stdin;
061b5d2f-1703-4be7-9741-0c07f0cb06b0	2026-03-07 20:38:52.338313+00	2026-03-07 20:38:52.338324+00	text	Hi, is this available?	f	3f77e3ef-7724-4ad7-8843-9899a0da93e9	1e5afbf8-d172-493c-92e7-2a4cc9925f5d
\.


--
-- Data for Name: marketplace_offers; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.marketplace_offers (id, created_at, updated_at, deleted_at, offered_price, counter_price, status, message, expires_at, buyer_id, product_id) FROM stdin;
c18a88d6-42d5-41a7-97a7-c1adcd4f6dfc	2026-03-07 20:38:52.333036+00	2026-03-07 20:38:52.333045+00	\N	22000.00	\N	pending	\N	2026-03-09 20:38:52.332893+00	1e5afbf8-d172-493c-92e7-2a4cc9925f5d	8d1d3718-2d1d-47c7-803a-3a0374f85595
\.


--
-- Data for Name: marketplace_product_images; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.marketplace_product_images (id, created_at, updated_at, image_url, sort_order, is_primary, product_id) FROM stdin;
\.


--
-- Data for Name: marketplace_products; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.marketplace_products (id, created_at, updated_at, deleted_at, title, description, post_type, price, price_unit, condition, is_negotiable, campus_visibility, status, duration_days, expires_at, is_hidden_by_user, is_auto_expired, repost_count, rejection_reason, safe_meetup_location, view_count, category_id, reviewed_by_id, university_id, user_id) FROM stdin;
8d1d3718-2d1d-47c7-803a-3a0374f85595	2026-03-07 20:38:51.899523+00	2026-03-07 20:38:51.899531+00	\N	Laptop For Sale	Great laptop in good condition	sell	25000.00	\N	good	t	university_only	sold	30	2026-03-14 20:38:52.559534+00	f	t	1	\N	\N	1	7594b16b-1911-4ea7-a2b5-951436b55821	dac84bbf-978d-4eb7-8e0e-dd17915d31ee	f43395fb-fa27-40c3-a07e-a89225f999f9	9a4276aa-d124-4347-bf71-9fa2d9719607
\.


--
-- Data for Name: marketplace_reports; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.marketplace_reports (id, created_at, updated_at, deleted_at, reason, description, status, admin_note, product_id, reporter_id, reviewed_by_id) FROM stdin;
7cdaecdc-a15e-4983-94f3-aa5373df5b91	2026-03-07 20:38:52.343902+00	2026-03-07 20:38:52.343912+00	\N	spam	\N	pending	\N	8d1d3718-2d1d-47c7-803a-3a0374f85595	1e5afbf8-d172-493c-92e7-2a4cc9925f5d	\N
\.


--
-- Data for Name: marketplace_reviews; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.marketplace_reviews (id, created_at, updated_at, deleted_at, rating, comment, is_verified_transaction, product_id, reviewer_id, seller_id) FROM stdin;
f25f5174-7244-4334-8459-92797ec332f4	2026-03-07 20:38:52.341256+00	2026-03-07 20:38:52.341265+00	\N	5	Great!	f	8d1d3718-2d1d-47c7-803a-3a0374f85595	1e5afbf8-d172-493c-92e7-2a4cc9925f5d	9a4276aa-d124-4347-bf71-9fa2d9719607
\.


--
-- Data for Name: seller_badges; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.seller_badges (id, created_at, updated_at, badge_type, display_label, is_active, awarded_at, revoked_at, awarded_by_id, store_id) FROM stdin;
50a27ec0-a1ab-4a01-94d2-24875f7b8734	2026-03-07 21:09:36.270183+00	2026-03-07 21:09:36.270191+00	student_seller	Student Seller of DIU	t	2026-03-07 21:09:36.269953+00	\N	\N	b638af7a-461c-454e-8b8b-045dac58a080
4c5020de-5b50-4ccc-b88c-bed934f2d286	2026-03-07 21:09:36.582519+00	2026-03-07 21:09:36.582528+00	fast_dispatch	Fast Dispatch	f	2026-03-07 21:09:36.582332+00	2026-03-07 21:09:36.629789+00	9d26ee33-2918-4da6-ab87-3431c782c422	b638af7a-461c-454e-8b8b-045dac58a080
\.


--
-- Data for Name: seller_payout_requests; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.seller_payout_requests (id, created_at, updated_at, deleted_at, amount, method, account_details_snapshot, status, bank_transaction_ref, note, processed_at, processed_by_id, seller_id) FROM stdin;
9c555079-1624-4447-b318-e925f2d31bc3	2026-03-07 21:09:36.502904+00	2026-03-07 21:09:36.502915+00	\N	1000.00	bkash	{"method": "bkash", "number": "01712345678"}	completed	TXN-001	\N	2026-03-07 21:09:36.52888+00	9d26ee33-2918-4da6-ab87-3431c782c422	c996dfca-23de-4a2b-9876-ad0a7865054c
\.


--
-- Data for Name: seller_profiles; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.seller_profiles (id, created_at, updated_at, deleted_at, business_name, business_type, nid_number, nid_front_url, nid_back_url, trade_license_url, tin_cert_url, vat_cert_url, brand_auth_letter_url, trademark_cert_url, bank_account_details, mobile_banking_method, mobile_banking_number, business_phone, business_email, status, commission_rate, is_student_seller, rejection_reason, approved_by_id, user_id) FROM stdin;
c996dfca-23de-4a2b-9876-ad0a7865054c	2026-03-07 21:09:35.718979+00	2026-03-07 21:09:35.721702+00	\N	Student Tech Store	student	gAAAAABprJQPkw9ckX4s4YMLFEA6ErPre0QJ6K0Q_3c6rbGb8lNv6DBO9NMBdfjmef2QikH0rcNRIdrSI096dMlBCuD989foww==	/media/test/nid_front.jpg	/media/test/nid_back.jpg	\N	\N	\N	\N	\N	gAAAAABprJQPwksmgdUe030Ki7jKNn_mui9_EdjIVkz_s74j2NLCDDYnCyoU4yIXGt8rz_GtjTuLxzt4lRrMr_LTUi_fGAmp8cmEBXlIYPNnv94il9RzbEWC9NUUV0E2NduNQeCFbklYlLqeh1MzdpLoPcuDz5sVAw==	bkash	gAAAAABprJQPPaHb2qjtlDGrIoJmotlzNPSfx82lqO6tqtugA8-L_gAC1wPNEKtWPFPe7ESB7H0GQOyWJ2NYBjuW7-6sHJbYEg==	01712345678	seller@test.com	approved	7.00	t	\N	9d26ee33-2918-4da6-ab87-3431c782c422	cee37380-4017-452e-be41-e85c7dd95c40
\.


--
-- Data for Name: stores; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.stores (id, created_at, updated_at, deleted_at, name, slug, description, logo_url, banner_url, store_category, return_policy, avg_dispatch_hours, shipping_coverage, business_phone, business_email, status, rejection_reason, rating_avg, review_count, total_sales_count, approved_by_id, seller_id, university_id) FROM stdin;
b638af7a-461c-454e-8b8b-045dac58a080	2026-03-07 21:09:36.089021+00	2026-03-07 21:09:36.089031+00	\N	Student Tech Hub	student-tech-hub	Best tech products for students	\N	\N	Electronics	7 day return policy	24	\N	01712345678	\N	active	\N	0.00	0	0	9d26ee33-2918-4da6-ab87-3431c782c422	c996dfca-23de-4a2b-9876-ad0a7865054c	f43395fb-fa27-40c3-a07e-a89225f999f9
\.


--
-- Data for Name: student_benefits; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.student_benefits (id, created_at, updated_at, deleted_at, benefit_type, discount_percentage, valid_from, valid_until, is_active, granted_by_id, seller_id) FROM stdin;
82f1f119-e4b2-441e-9b7d-fa4bd34a6c44	2026-03-07 21:09:36.650903+00	2026-03-07 21:09:36.650911+00	\N	commission_discount	3.00	2026-03-07	2026-06-05	t	9d26ee33-2918-4da6-ab87-3431c782c422	c996dfca-23de-4a2b-9876-ad0a7865054c
\.


--
-- Data for Name: token_blacklist_blacklistedtoken; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.token_blacklist_blacklistedtoken (id, blacklisted_at, token_id) FROM stdin;
1	2026-03-07 18:09:48.528016+00	1
2	2026-03-07 18:11:15.640749+00	3
3	2026-03-07 18:14:54.945502+00	4
4	2026-03-07 18:15:38.647442+00	5
\.


--
-- Data for Name: token_blacklist_outstandingtoken; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.token_blacklist_outstandingtoken (id, token, created_at, expires_at, user_id, jti) FROM stdin;
1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUxMTc4OCwiaWF0IjoxNzcyOTA2OTg4LCJqdGkiOiIzZTE5NDRlMjE3MzA0MDc4YTE5N2E5M2U5OTJhOTEzMiIsInVzZXJfaWQiOiJmMWNhYTZhYi00NjBmLTQxNTMtOGQzMC00ODJmOTdiZGY1YTIifQ.TcmKEEstMCJz_DIjuDa-10AHrk1TWV_ZJ8ysS1-_GVU	2026-03-07 18:09:48.386996+00	2026-03-14 18:09:48+00	f1caa6ab-460f-4153-8d30-482f97bdf5a2	3e1944e217304078a197a93e992a9132
2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUxMTgwNiwiaWF0IjoxNzcyOTA3MDA2LCJqdGkiOiIxNTRjM2Q5ZTM0N2U0ZGY2ODEzOGE0ZTE5MTUyZjhmNyIsInVzZXJfaWQiOiJmMWNhYTZhYi00NjBmLTQxNTMtOGQzMC00ODJmOTdiZGY1YTIifQ.fz1KTKoQr219ExcRw9hdhWIYHlKFGcJKcqVX-xAfBmc	2026-03-07 18:10:06.521918+00	2026-03-14 18:10:06+00	f1caa6ab-460f-4153-8d30-482f97bdf5a2	154c3d9e347e4df68138a4e19152f8f7
3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUxMTg3NSwiaWF0IjoxNzcyOTA3MDc1LCJqdGkiOiIyZDQzNDhhYTA0ZDY0NDdlYTJmZjIzYTkxN2M3ZjZlMyIsInVzZXJfaWQiOiI1YWMzMDhjYS01ZDU1LTQ3NGUtYjE3Yy1jZTdmNTlmMDhjYjYifQ.-XbARFh9X3YkjGYmzPGT3zGkFvaRT-cGuhhTuGs_Sn4	2026-03-07 18:11:15.541208+00	2026-03-14 18:11:15+00	5ac308ca-5d55-474e-b17c-ce7f59f08cb6	2d4348aa04d6447ea2ff23a917c7f6e3
4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUxMjA5NCwiaWF0IjoxNzcyOTA3Mjk0LCJqdGkiOiIyM2I4NmM4MzhlODY0NThhODc0YjVkMWRkNDI0ZGVkYSIsInVzZXJfaWQiOiIzYTQzNzIxOS03NWZmLTQ1YWQtYTE1YS1kN2ZkYzY5NjM3NTgifQ.9cnWiNgi_8GjVgNRPDaBUjhDoeF1yzaAWiGciQ9RkFI	2026-03-07 18:14:54.886275+00	2026-03-14 18:14:54+00	3a437219-75ff-45ad-a15a-d7fdc6963758	23b86c838e86458a874b5d1dd424deda
5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUxMjEzOCwiaWF0IjoxNzcyOTA3MzM4LCJqdGkiOiI5MzZlYjVmZTE0MWQ0NjI2YjI4OWRkZmExNTU5MDAzMCIsInVzZXJfaWQiOiJlYjY3MmEzNi1hZmZmLTQ2NTUtOWZkNS00YWFiZTUyNTUwNWQifQ.eqmjfBT889vtnLkXeYPo8PXBxrUNW6HCnd0Oi4h5xqI	2026-03-07 18:15:38.542257+00	2026-03-14 18:15:38+00	eb672a36-afff-4655-9fd5-4aabe525505d	936eb5fe141d4626b289ddfa15590030
6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUxNzAyOSwiaWF0IjoxNzcyOTEyMjI5LCJqdGkiOiJlZjA2ZGZiZWM2NTg0NzQwODY4NDFlZTkzY2M1NTdiZiIsInVzZXJfaWQiOiIwNWQ3ZTc2Yi03YmZhLTRmZTMtYTMzYi0zYTE4OWExZjYxY2EifQ.VTmVuEWyGu2FjAXBnbxfe-H1k2TVPN9awbhW6Rft3Sg	2026-03-07 19:37:09.601036+00	2026-03-14 19:37:09+00	05d7e76b-7bfa-4fe3-a33b-3a189a1f61ca	ef06dfbec658474086841ee93cc557bf
7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUxNzAyOSwiaWF0IjoxNzcyOTEyMjI5LCJqdGkiOiIzMzk4NDAzODgxZTQ0ZTZiOWQ3ZDkzOTIwYzY5OWU5NyIsInVzZXJfaWQiOiJiNjNhYzFjOS04MDM2LTRlMzQtYjRhZC0yNDViNjQ5Y2ZiOGUifQ.Fu2vYjY9fGdxAWf82CZ7-1xET0_Mvzvh2t6Gbl136Do	2026-03-07 19:37:09.984849+00	2026-03-14 19:37:09+00	b63ac1c9-8036-4e34-b4ad-245b649cfb8e	3398403881e44e6b9d7d93920c699e97
8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUxOTg0MSwiaWF0IjoxNzcyOTE1MDQxLCJqdGkiOiIyMWIyZDJhNjZkYmQ0YjJmYWMxNTk4ZDg1OTRlNDdhYiIsInVzZXJfaWQiOiJmYzM0ZTg1MS1lMTM1LTQ4YjItYmMzZC1mN2UwMzhlNmJjZTkifQ.hkEhQ0Eta2tULcuebFo0S8BE_PyOARgQnsB65AmbW10	2026-03-07 20:24:01.759525+00	2026-03-14 20:24:01+00	fc34e851-e135-48b2-bc3d-f7e038e6bce9	21b2d2a66dbd4b2fac1598d8594e47ab
9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUxOTg0MiwiaWF0IjoxNzcyOTE1MDQyLCJqdGkiOiIzODg0ZTFmYzY2NWQ0YzgxYTMwMjJkZTYwODRjNGNhMCIsInVzZXJfaWQiOiJlODQ3MjFhZi1iN2QzLTRkZmUtOTY3Yi0yOTA1MjljNDZlMzMifQ.Qz78Lpaez9WvGbczkbxKZvyhwDmT-aWHFcDHwxMShi8	2026-03-07 20:24:02.163351+00	2026-03-14 20:24:02+00	e84721af-b7d3-4dfe-967b-290529c46e33	3884e1fc665d4c81a3022de6084c4ca0
10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUxOTg0MiwiaWF0IjoxNzcyOTE1MDQyLCJqdGkiOiIxM2Y1NjZkYzg2ZWM0OGJhOTI2ZmZjMDEyZWRmMzA3NSIsInVzZXJfaWQiOiIwNWNlOTFmMS05NDQzLTRkNzAtYjNhMC0xMzE3NThiNTc4YjMifQ.TrDzxFLGnyZC-pJgWSVKpkJY7CzVyNO9ukE26wFMTVc	2026-03-07 20:24:02.509869+00	2026-03-14 20:24:02+00	05ce91f1-9443-4d70-b3a0-131758b578b3	13f566dc86ec48ba926ffc012edf3075
11	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUxOTkzMiwiaWF0IjoxNzcyOTE1MTMyLCJqdGkiOiIwZWFiYzI5Yzk0ZjI0MzgyOWExMDY4N2Y5YzNhYjA4YyIsInVzZXJfaWQiOiI4MDllN2M1ZS0wOTNmLTRiMjItOTk3Ni1mOWE4MjIwNWI3MTgifQ.6yJfEma2LNNvJdKEIoDOjku7mPhoVVgSg2Be1NxxJ9g	2026-03-07 20:25:32.651457+00	2026-03-14 20:25:32+00	\N	0eabc29c94f243829a10687f9c3ab08c
12	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUxOTkzMiwiaWF0IjoxNzcyOTE1MTMyLCJqdGkiOiI4Y2IzZWRkZWM2ZDM0M2ExOWRmMWM0ZTU5NjQ3ZTE3NiIsInVzZXJfaWQiOiJhZDcwODMyZS1iMDExLTQzMmItYmY4YS0yOGE2YmE1M2Q2YjAifQ.UFzoAqcjj0SBoql28XEGkmOcHULt-QlyH0IAr_NwKe0	2026-03-07 20:25:32.990158+00	2026-03-14 20:25:32+00	\N	8cb3eddec6d343a19df1c4e59647e176
13	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUxOTkzMywiaWF0IjoxNzcyOTE1MTMzLCJqdGkiOiI0NzI5MDJiY2ViOWI0NGUxODIzNTcxOGYzYjNkODViOSIsInVzZXJfaWQiOiI1ZWYwMzM0MS1iODRiLTRlYzItOGM3My04YzU5ODUwZmNlZTIifQ.4SBs3ul4OGKABZ8pFoEqdiVoYfHEOw1NpALhiRLnbLA	2026-03-07 20:25:33.347269+00	2026-03-14 20:25:33+00	\N	472902bceb9b44e18235718f3b3d85b9
14	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUxOTk0OSwiaWF0IjoxNzcyOTE1MTQ5LCJqdGkiOiJkNjg4ZGU4MzkzYTc0Mzk0YWUyNGFhNDQxODE0ODRhMCIsInVzZXJfaWQiOiIxNzNiNzQ0MS0zN2U5LTRhZTEtODJlMi1jMDU3MzVmZDliZjgifQ.Vfl9cxbCW3S84BJ7KFmQvQZ3slxKNVUisjWy_en-VWw	2026-03-07 20:25:49.490825+00	2026-03-14 20:25:49+00	\N	d688de8393a74394ae24aa44181484a0
15	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUxOTk0OSwiaWF0IjoxNzcyOTE1MTQ5LCJqdGkiOiI5Zjk2Y2UxNjc0NTU0NWMwYjA1OWMzZDMwZjJjNTAyMiIsInVzZXJfaWQiOiJhMjI1Njg1Ny0xMzk5LTRkYTctOTg1NS1kMmE2OTlhNjc0NDgifQ.XAGgaG93cvj48M845SZgNd3fitQaWGsYxyMLegMR7Iw	2026-03-07 20:25:49.821932+00	2026-03-14 20:25:49+00	\N	9f96ce16745545c0b059c3d30f2c5022
16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUxOTk1MCwiaWF0IjoxNzcyOTE1MTUwLCJqdGkiOiJhNGRlYWFkOTYyZTk0NTQ2YmFhYjA1YmIwMGYzNWE3OCIsInVzZXJfaWQiOiI0MTNiNjc2Yi0wNTYzLTQ5NDctYTBhMS0wMDA0OGQzNWEzYzMifQ.cxtnj8QQVq8kaGPhNUCF0KNa0MDGAIsTiOuuoBWUieA	2026-03-07 20:25:50.149913+00	2026-03-14 20:25:50+00	\N	a4deaad962e94546baab05bb00f35a78
17	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUyMDA2MSwiaWF0IjoxNzcyOTE1MjYxLCJqdGkiOiI2MTE2M2FmMWVlOWI0YjIxYmVlZDg2NjJmODM4YmIzMiIsInVzZXJfaWQiOiIwOGI3ODk0ZS1lYmFlLTQ0NGMtODY2Yi00MDI5ZThjM2M0YTEifQ.r8pcGkLyxUBi7T2RT9wFZUwU3Pfxuu0aYaTxVUBng0s	2026-03-07 20:27:41.289774+00	2026-03-14 20:27:41+00	\N	61163af1ee9b4b21beed8662f838bb32
18	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUyMDA2MSwiaWF0IjoxNzcyOTE1MjYxLCJqdGkiOiI3ZjViODI0OGEwOWI0YzJkOTg5Y2M5ZGFjZTUyY2JkYiIsInVzZXJfaWQiOiI1MjI5MDkzOS0xMTU3LTRjZGQtYTU5My1kNjBkYjI0ZDJmNjAifQ.BLfRAzvnNI0g9s5XXa8Dl4KhTPsL1REK_zOuPsa72fI	2026-03-07 20:27:41.675978+00	2026-03-14 20:27:41+00	\N	7f5b8248a09b4c2d989cc9dace52cbdb
19	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUyMDA2MiwiaWF0IjoxNzcyOTE1MjYyLCJqdGkiOiJmMjI2ZjI3ZGQ1N2M0Yjk3OTdlNTEwMjg3YjQ3NzQ5NyIsInVzZXJfaWQiOiJiYzkwYzM1MC1hMjY0LTQ2ZDItYmZjNS1jYjEzNTI3ZGMzNzUifQ.bKMxMcrhO1CXwRoSASbSkYoMmqrmTL4myARNqVF3Nwk	2026-03-07 20:27:42.018026+00	2026-03-14 20:27:42+00	\N	f226f27dd57c4b9797e510287b477497
20	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUyMDM1MywiaWF0IjoxNzcyOTE1NTUzLCJqdGkiOiJlZWNjNWJlYjliZWQ0ZjAyOGI4OTIyYTNlYmMzYTk1NSIsInVzZXJfaWQiOiJmMzJjZGJjMS0xOGY4LTQzNjAtYjVkNi05ZDVjOWRmOWFmN2QifQ.VYLc2uvYYwJWkLDJouh0fmKsDeCPJUY4hXK-G7rFchU	2026-03-07 20:32:33.677848+00	2026-03-14 20:32:33+00	\N	eecc5beb9bed4f028b8922a3ebc3a955
21	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUyMDM1NCwiaWF0IjoxNzcyOTE1NTU0LCJqdGkiOiIyNWVmODU2NjZhNmQ0NDY5YjdhZjVmMmU4NThkZWM1NCIsInVzZXJfaWQiOiIzNThmZDAwZi03MzczLTQxZTYtODlhYy1jMDUyYmEwOWZjZTEifQ.sFyYrrsWEX-6h1aoChv32bDP-3YgRADSFDX0Yp7CHL8	2026-03-07 20:32:34.065554+00	2026-03-14 20:32:34+00	\N	25ef85666a6d4469b7af5f2e858dec54
22	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUyMDM1NCwiaWF0IjoxNzcyOTE1NTU0LCJqdGkiOiIwZmVhY2M5ZTJjYzk0ODlhYWI1NjgzMDZmMTZmNTUzNiIsInVzZXJfaWQiOiI4YmRlOGU2Zi02MzkxLTRhZjQtOTEwNy0wODA2NGJiN2U0ZWEifQ.tiLxKiPRY9H0ZwzpNYk24xpMxMc8sQCs_9knscQLQfw	2026-03-07 20:32:34.485101+00	2026-03-14 20:32:34+00	\N	0feacc9e2cc9489aab568306f16f5536
23	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUyMDczMSwiaWF0IjoxNzcyOTE1OTMxLCJqdGkiOiIxODQzMmFjNWM4ZDI0ODg1OWI2Y2IyNjJmODc4MjVhZCIsInVzZXJfaWQiOiI5YTQyNzZhYS1kMTI0LTQzNDctYmY3MS05ZmEyZDk3MTk2MDcifQ.CE1A3Stvvr_g_2Gkd2Gk-EeTzlmonHRs1XwF-evNtBs	2026-03-07 20:38:51.091053+00	2026-03-14 20:38:51+00	9a4276aa-d124-4347-bf71-9fa2d9719607	18432ac5c8d248859b6cb262f87825ad
24	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUyMDczMSwiaWF0IjoxNzcyOTE1OTMxLCJqdGkiOiIwNWU5ZWU0YjQzZjE0YTRkOGE0ZGQwNmRmZGM4MzBkNCIsInVzZXJfaWQiOiJkYWM4NGJiZi05NzhkLTRlYjctOGUwZS1kZDE3OTE1ZDMxZWUifQ.FPobG20EjCJQME6hYfJwjQvj4Pg_nUGso0qf5G5pSDg	2026-03-07 20:38:51.458137+00	2026-03-14 20:38:51+00	dac84bbf-978d-4eb7-8e0e-dd17915d31ee	05e9ee4b43f14a4d8a4dd06dfdc830d4
25	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUyMDczMSwiaWF0IjoxNzcyOTE1OTMxLCJqdGkiOiI0YmUxMjVjY2Q3M2E0MDc4ODhlMWIyZWY5OWRhODJhOCIsInVzZXJfaWQiOiIxZTVhZmJmOC1kMTcyLTQ5M2MtOTJlNy0yYTRjYzk5MjVmNWQifQ.hL1p0Odkb43zmujXuNF6pskQJECGSX3ptGNdOM828G8	2026-03-07 20:38:51.791247+00	2026-03-14 20:38:51+00	1e5afbf8-d172-493c-92e7-2a4cc9925f5d	4be125ccd73a407888e1b2ef99da82a8
26	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUyMjQ1OSwiaWF0IjoxNzcyOTE3NjU5LCJqdGkiOiJiZjNmYTQzYzUxNjc0ZGE3OTVkZWVkMWY3YzYzYjgyZSIsInVzZXJfaWQiOiJhZjNjNjM5Ni1mMTk4LTQ5ZjYtYWU1Ny1jMTAyMWZmYTdlY2QifQ.XTJENwUKWuKVjFxOIkXdlHqJpxHgN8DlNnfj042XXnM	2026-03-07 21:07:39.496413+00	2026-03-14 21:07:39+00	\N	bf3fa43c51674da795deed1f7c63b82e
27	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUyMjQ1OSwiaWF0IjoxNzcyOTE3NjU5LCJqdGkiOiJmMzY5MjJkOTA2ZWM0NzZlYWNlOTA4MzliZDBlYThlNyIsInVzZXJfaWQiOiIyMDE5MDk5OS05ODg3LTRjYTAtOGVmOC0wMGM0ZmNlZTgwNmUifQ._YFBf5VO6oPmX0cEg2X6lCJRmM21_rVaO_5HuDch-Rw	2026-03-07 21:07:39.910373+00	2026-03-14 21:07:39+00	\N	f36922d906ec476eace90839bd0ea8e7
28	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUyMjQ5MSwiaWF0IjoxNzcyOTE3NjkxLCJqdGkiOiJkMzBjZmI5MzMxNzc0ZTM3YjZiNjJlNjdlODdlZjQ0NyIsInVzZXJfaWQiOiIyMDE5MDk5OS05ODg3LTRjYTAtOGVmOC0wMGM0ZmNlZTgwNmUifQ.CVgDlSse0xia-8KcRyUDL2uABkazUF1KTXpGUAY3bbM	2026-03-07 21:08:11.246888+00	2026-03-14 21:08:11+00	\N	d30cfb9331774e37b6b62e67e87ef447
29	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUyMjU3NSwiaWF0IjoxNzcyOTE3Nzc1LCJqdGkiOiI5OGU3NTdhZjM0MjM0ZWY0ODBjM2JiZGZhYWM4NDFjOSIsInVzZXJfaWQiOiJjZWUzNzM4MC00MDE3LTQ1MmUtYmU0MS1lODVjN2RkOTVjNDAifQ.-iUGENxdN1LqUsGkL_jQyPkZusaDBOAJe0xc2kWPfXw	2026-03-07 21:09:35.266192+00	2026-03-14 21:09:35+00	cee37380-4017-452e-be41-e85c7dd95c40	98e757af34234ef480c3bbdfaac841c9
30	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3MzUyMjU3NSwiaWF0IjoxNzcyOTE3Nzc1LCJqdGkiOiJjNDBmOWMzY2M4MTU0YWNiYTYwMmM1ODYyZTZmN2Y2ZSIsInVzZXJfaWQiOiI5ZDI2ZWUzMy0yOTE4LTRkYTYtYWI4Ny0zNDMxYzc4MmM0MjIifQ.RZ-1QdK35B6hORQc0ASC_fQhXGr8YOcOkustj3NVFw4	2026-03-07 21:09:35.669756+00	2026-03-14 21:09:35+00	9d26ee33-2918-4da6-ab87-3431c782c422	c40f9c3cc8154acba602c5862e6f7f6e
\.


--
-- Data for Name: universities; Type: TABLE DATA; Schema: public; Owner: campushat_user
--

COPY public.universities (id, created_at, updated_at, deleted_at, name, short_name, slug, system_id, division, district, postal_code, full_address, short_description, logo_url, is_active, sso_enabled, sso_provider, sso_domain) FROM stdin;
f43395fb-fa27-40c3-a07e-a89225f999f9	2026-03-07 18:07:18.294899+00	2026-03-07 18:07:18.294917+00	\N	Daffodil International University	DIU	diu	UNIV-00001	Dhaka	Dhaka	1207	Daffodil Smart City, Birulia, Savar, Dhaka	\N	\N	t	f	\N	\N
\.


--
-- Name: auth_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: campushat_user
--

SELECT pg_catalog.setval('public.auth_group_id_seq', 1, false);


--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: campushat_user
--

SELECT pg_catalog.setval('public.auth_group_permissions_id_seq', 1, false);


--
-- Name: auth_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: campushat_user
--

SELECT pg_catalog.setval('public.auth_permission_id_seq', 128, true);


--
-- Name: auth_users_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: campushat_user
--

SELECT pg_catalog.setval('public.auth_users_groups_id_seq', 1, false);


--
-- Name: auth_users_user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: campushat_user
--

SELECT pg_catalog.setval('public.auth_users_user_permissions_id_seq', 1, false);


--
-- Name: django_admin_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: campushat_user
--

SELECT pg_catalog.setval('public.django_admin_log_id_seq', 1, false);


--
-- Name: django_celery_beat_clockedschedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: campushat_user
--

SELECT pg_catalog.setval('public.django_celery_beat_clockedschedule_id_seq', 1, false);


--
-- Name: django_celery_beat_crontabschedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: campushat_user
--

SELECT pg_catalog.setval('public.django_celery_beat_crontabschedule_id_seq', 1, true);


--
-- Name: django_celery_beat_intervalschedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: campushat_user
--

SELECT pg_catalog.setval('public.django_celery_beat_intervalschedule_id_seq', 1, false);


--
-- Name: django_celery_beat_periodictask_id_seq; Type: SEQUENCE SET; Schema: public; Owner: campushat_user
--

SELECT pg_catalog.setval('public.django_celery_beat_periodictask_id_seq', 1, true);


--
-- Name: django_celery_beat_solarschedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: campushat_user
--

SELECT pg_catalog.setval('public.django_celery_beat_solarschedule_id_seq', 1, false);


--
-- Name: django_content_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: campushat_user
--

SELECT pg_catalog.setval('public.django_content_type_id_seq', 32, true);


--
-- Name: django_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: campushat_user
--

SELECT pg_catalog.setval('public.django_migrations_id_seq', 54, true);


--
-- Name: token_blacklist_blacklistedtoken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: campushat_user
--

SELECT pg_catalog.setval('public.token_blacklist_blacklistedtoken_id_seq', 4, true);


--
-- Name: token_blacklist_outstandingtoken_id_seq; Type: SEQUENCE SET; Schema: public; Owner: campushat_user
--

SELECT pg_catalog.setval('public.token_blacklist_outstandingtoken_id_seq', 30, true);


--
-- Name: auth_email_verification_tokens auth_email_verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_email_verification_tokens
    ADD CONSTRAINT auth_email_verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: auth_email_verification_tokens auth_email_verification_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_email_verification_tokens
    ADD CONSTRAINT auth_email_verification_tokens_token_key UNIQUE (token);


--
-- Name: auth_group auth_group_name_key; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);


--
-- Name: auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);


--
-- Name: auth_group_permissions auth_group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- Name: auth_permission auth_permission_content_type_id_codename_01ab375a_uniq; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);


--
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- Name: auth_user_addresses auth_user_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_user_addresses
    ADD CONSTRAINT auth_user_addresses_pkey PRIMARY KEY (id);


--
-- Name: auth_user_sessions auth_user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_user_sessions
    ADD CONSTRAINT auth_user_sessions_pkey PRIMARY KEY (id);


--
-- Name: auth_user_sessions auth_user_sessions_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_user_sessions
    ADD CONSTRAINT auth_user_sessions_token_hash_key UNIQUE (token_hash);


--
-- Name: auth_user_verifications auth_user_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_user_verifications
    ADD CONSTRAINT auth_user_verifications_pkey PRIMARY KEY (id);


--
-- Name: auth_user_verifications auth_user_verifications_user_id_verification_type_3b12f131_uniq; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_user_verifications
    ADD CONSTRAINT auth_user_verifications_user_id_verification_type_3b12f131_uniq UNIQUE (user_id, verification_type);


--
-- Name: auth_users auth_users_email_key; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_email_key UNIQUE (email);


--
-- Name: auth_users_groups auth_users_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_users_groups
    ADD CONSTRAINT auth_users_groups_pkey PRIMARY KEY (id);


--
-- Name: auth_users_groups auth_users_groups_user_id_group_id_64a20d79_uniq; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_users_groups
    ADD CONSTRAINT auth_users_groups_user_id_group_id_64a20d79_uniq UNIQUE (user_id, group_id);


--
-- Name: auth_users auth_users_phone_key; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_phone_key UNIQUE (phone);


--
-- Name: auth_users auth_users_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_pkey PRIMARY KEY (id);


--
-- Name: auth_users_user_permissions auth_users_user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_users_user_permissions
    ADD CONSTRAINT auth_users_user_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_users_user_permissions auth_users_user_permissions_user_id_permission_id_6cc07159_uniq; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_users_user_permissions
    ADD CONSTRAINT auth_users_user_permissions_user_id_permission_id_6cc07159_uniq UNIQUE (user_id, permission_id);


--
-- Name: django_admin_log django_admin_log_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);


--
-- Name: django_celery_beat_clockedschedule django_celery_beat_clockedschedule_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.django_celery_beat_clockedschedule
    ADD CONSTRAINT django_celery_beat_clockedschedule_pkey PRIMARY KEY (id);


--
-- Name: django_celery_beat_crontabschedule django_celery_beat_crontabschedule_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.django_celery_beat_crontabschedule
    ADD CONSTRAINT django_celery_beat_crontabschedule_pkey PRIMARY KEY (id);


--
-- Name: django_celery_beat_intervalschedule django_celery_beat_intervalschedule_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.django_celery_beat_intervalschedule
    ADD CONSTRAINT django_celery_beat_intervalschedule_pkey PRIMARY KEY (id);


--
-- Name: django_celery_beat_periodictask django_celery_beat_periodictask_name_key; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.django_celery_beat_periodictask
    ADD CONSTRAINT django_celery_beat_periodictask_name_key UNIQUE (name);


--
-- Name: django_celery_beat_periodictask django_celery_beat_periodictask_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.django_celery_beat_periodictask
    ADD CONSTRAINT django_celery_beat_periodictask_pkey PRIMARY KEY (id);


--
-- Name: django_celery_beat_periodictasks django_celery_beat_periodictasks_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.django_celery_beat_periodictasks
    ADD CONSTRAINT django_celery_beat_periodictasks_pkey PRIMARY KEY (ident);


--
-- Name: django_celery_beat_solarschedule django_celery_beat_solar_event_latitude_longitude_ba64999a_uniq; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.django_celery_beat_solarschedule
    ADD CONSTRAINT django_celery_beat_solar_event_latitude_longitude_ba64999a_uniq UNIQUE (event, latitude, longitude);


--
-- Name: django_celery_beat_solarschedule django_celery_beat_solarschedule_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.django_celery_beat_solarschedule
    ADD CONSTRAINT django_celery_beat_solarschedule_pkey PRIMARY KEY (id);


--
-- Name: django_content_type django_content_type_app_label_model_76bd3d3b_uniq; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);


--
-- Name: django_content_type django_content_type_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);


--
-- Name: django_migrations django_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);


--
-- Name: django_session django_session_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);


--
-- Name: marketplace_categories marketplace_categories_name_ad_type_parent_id_1ef12e3b_uniq; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_categories
    ADD CONSTRAINT marketplace_categories_name_ad_type_parent_id_1ef12e3b_uniq UNIQUE (name, ad_type, parent_id);


--
-- Name: marketplace_categories marketplace_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_categories
    ADD CONSTRAINT marketplace_categories_pkey PRIMARY KEY (id);


--
-- Name: marketplace_categories marketplace_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_categories
    ADD CONSTRAINT marketplace_categories_slug_key UNIQUE (slug);


--
-- Name: marketplace_chats marketplace_chats_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_chats
    ADD CONSTRAINT marketplace_chats_pkey PRIMARY KEY (id);


--
-- Name: marketplace_chats marketplace_chats_product_id_buyer_id_536ce863_uniq; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_chats
    ADD CONSTRAINT marketplace_chats_product_id_buyer_id_536ce863_uniq UNIQUE (product_id, buyer_id);


--
-- Name: marketplace_messages marketplace_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_messages
    ADD CONSTRAINT marketplace_messages_pkey PRIMARY KEY (id);


--
-- Name: marketplace_offers marketplace_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_offers
    ADD CONSTRAINT marketplace_offers_pkey PRIMARY KEY (id);


--
-- Name: marketplace_offers marketplace_offers_product_id_buyer_id_24855b3a_uniq; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_offers
    ADD CONSTRAINT marketplace_offers_product_id_buyer_id_24855b3a_uniq UNIQUE (product_id, buyer_id);


--
-- Name: marketplace_product_images marketplace_product_images_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_product_images
    ADD CONSTRAINT marketplace_product_images_pkey PRIMARY KEY (id);


--
-- Name: marketplace_products marketplace_products_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_products
    ADD CONSTRAINT marketplace_products_pkey PRIMARY KEY (id);


--
-- Name: marketplace_reports marketplace_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_reports
    ADD CONSTRAINT marketplace_reports_pkey PRIMARY KEY (id);


--
-- Name: marketplace_reports marketplace_reports_product_id_reporter_id_ad464ef2_uniq; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_reports
    ADD CONSTRAINT marketplace_reports_product_id_reporter_id_ad464ef2_uniq UNIQUE (product_id, reporter_id);


--
-- Name: marketplace_reviews marketplace_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_reviews
    ADD CONSTRAINT marketplace_reviews_pkey PRIMARY KEY (id);


--
-- Name: marketplace_reviews marketplace_reviews_product_id_reviewer_id_fea65bfb_uniq; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_reviews
    ADD CONSTRAINT marketplace_reviews_product_id_reviewer_id_fea65bfb_uniq UNIQUE (product_id, reviewer_id);


--
-- Name: seller_badges seller_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.seller_badges
    ADD CONSTRAINT seller_badges_pkey PRIMARY KEY (id);


--
-- Name: seller_payout_requests seller_payout_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.seller_payout_requests
    ADD CONSTRAINT seller_payout_requests_pkey PRIMARY KEY (id);


--
-- Name: seller_profiles seller_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.seller_profiles
    ADD CONSTRAINT seller_profiles_pkey PRIMARY KEY (id);


--
-- Name: seller_profiles seller_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.seller_profiles
    ADD CONSTRAINT seller_profiles_user_id_key UNIQUE (user_id);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);


--
-- Name: stores stores_seller_id_key; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_seller_id_key UNIQUE (seller_id);


--
-- Name: stores stores_slug_key; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_slug_key UNIQUE (slug);


--
-- Name: student_benefits student_benefits_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.student_benefits
    ADD CONSTRAINT student_benefits_pkey PRIMARY KEY (id);


--
-- Name: token_blacklist_blacklistedtoken token_blacklist_blacklistedtoken_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.token_blacklist_blacklistedtoken
    ADD CONSTRAINT token_blacklist_blacklistedtoken_pkey PRIMARY KEY (id);


--
-- Name: token_blacklist_blacklistedtoken token_blacklist_blacklistedtoken_token_id_key; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.token_blacklist_blacklistedtoken
    ADD CONSTRAINT token_blacklist_blacklistedtoken_token_id_key UNIQUE (token_id);


--
-- Name: token_blacklist_outstandingtoken token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_uniq; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.token_blacklist_outstandingtoken
    ADD CONSTRAINT token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_uniq UNIQUE (jti);


--
-- Name: token_blacklist_outstandingtoken token_blacklist_outstandingtoken_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.token_blacklist_outstandingtoken
    ADD CONSTRAINT token_blacklist_outstandingtoken_pkey PRIMARY KEY (id);


--
-- Name: universities universities_name_key; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.universities
    ADD CONSTRAINT universities_name_key UNIQUE (name);


--
-- Name: universities universities_pkey; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.universities
    ADD CONSTRAINT universities_pkey PRIMARY KEY (id);


--
-- Name: universities universities_short_name_key; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.universities
    ADD CONSTRAINT universities_short_name_key UNIQUE (short_name);


--
-- Name: universities universities_slug_key; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.universities
    ADD CONSTRAINT universities_slug_key UNIQUE (slug);


--
-- Name: universities universities_system_id_key; Type: CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.universities
    ADD CONSTRAINT universities_system_id_key UNIQUE (system_id);


--
-- Name: auth_email_verification_tokens_token_ba350b22_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_email_verification_tokens_token_ba350b22_like ON public.auth_email_verification_tokens USING btree (token varchar_pattern_ops);


--
-- Name: auth_email_verification_tokens_user_id_b858f3e8; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_email_verification_tokens_user_id_b858f3e8 ON public.auth_email_verification_tokens USING btree (user_id);


--
-- Name: auth_group_name_a6ea08ec_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_group_name_a6ea08ec_like ON public.auth_group USING btree (name varchar_pattern_ops);


--
-- Name: auth_group_permissions_group_id_b120cbf9; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON public.auth_group_permissions USING btree (group_id);


--
-- Name: auth_group_permissions_permission_id_84c5c92e; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON public.auth_group_permissions USING btree (permission_id);


--
-- Name: auth_permission_content_type_id_2f476e4b; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_permission_content_type_id_2f476e4b ON public.auth_permission USING btree (content_type_id);


--
-- Name: auth_user_addresses_created_at_7cc1ad24; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_user_addresses_created_at_7cc1ad24 ON public.auth_user_addresses USING btree (created_at);


--
-- Name: auth_user_addresses_deleted_at_68937ed8; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_user_addresses_deleted_at_68937ed8 ON public.auth_user_addresses USING btree (deleted_at);


--
-- Name: auth_user_addresses_user_id_04f87b71; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_user_addresses_user_id_04f87b71 ON public.auth_user_addresses USING btree (user_id);


--
-- Name: auth_user_sessions_created_at_d55c6388; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_user_sessions_created_at_d55c6388 ON public.auth_user_sessions USING btree (created_at);


--
-- Name: auth_user_sessions_expires_at_244185fe; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_user_sessions_expires_at_244185fe ON public.auth_user_sessions USING btree (expires_at);


--
-- Name: auth_user_sessions_token_hash_f29a1189_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_user_sessions_token_hash_f29a1189_like ON public.auth_user_sessions USING btree (token_hash varchar_pattern_ops);


--
-- Name: auth_user_sessions_user_id_fbf11f9e; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_user_sessions_user_id_fbf11f9e ON public.auth_user_sessions USING btree (user_id);


--
-- Name: auth_user_verifications_created_at_5205d57f; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_user_verifications_created_at_5205d57f ON public.auth_user_verifications USING btree (created_at);


--
-- Name: auth_user_verifications_deleted_at_f5ef3f09; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_user_verifications_deleted_at_f5ef3f09 ON public.auth_user_verifications USING btree (deleted_at);


--
-- Name: auth_user_verifications_reviewed_by_id_3125802c; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_user_verifications_reviewed_by_id_3125802c ON public.auth_user_verifications USING btree (reviewed_by_id);


--
-- Name: auth_user_verifications_status_79a6d819; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_user_verifications_status_79a6d819 ON public.auth_user_verifications USING btree (status);


--
-- Name: auth_user_verifications_status_79a6d819_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_user_verifications_status_79a6d819_like ON public.auth_user_verifications USING btree (status varchar_pattern_ops);


--
-- Name: auth_user_verifications_user_id_e30039ee; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_user_verifications_user_id_e30039ee ON public.auth_user_verifications USING btree (user_id);


--
-- Name: auth_users_created_at_d7f6ffcb; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_users_created_at_d7f6ffcb ON public.auth_users USING btree (created_at);


--
-- Name: auth_users_deleted_at_6272b803; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_users_deleted_at_6272b803 ON public.auth_users USING btree (deleted_at);


--
-- Name: auth_users_email_d961f1be_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_users_email_d961f1be_like ON public.auth_users USING btree (email varchar_pattern_ops);


--
-- Name: auth_users_groups_group_id_0f75702f; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_users_groups_group_id_0f75702f ON public.auth_users_groups USING btree (group_id);


--
-- Name: auth_users_groups_user_id_70322499; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_users_groups_user_id_70322499 ON public.auth_users_groups USING btree (user_id);


--
-- Name: auth_users_is_active_d0ee75b1; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_users_is_active_d0ee75b1 ON public.auth_users USING btree (is_active);


--
-- Name: auth_users_phone_3747d037_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_users_phone_3747d037_like ON public.auth_users USING btree (phone varchar_pattern_ops);


--
-- Name: auth_users_role_f7b3b946; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_users_role_f7b3b946 ON public.auth_users USING btree (role);


--
-- Name: auth_users_role_f7b3b946_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_users_role_f7b3b946_like ON public.auth_users USING btree (role varchar_pattern_ops);


--
-- Name: auth_users_university_id_17e6a682; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_users_university_id_17e6a682 ON public.auth_users USING btree (university_id);


--
-- Name: auth_users_user_permissions_permission_id_ed9ffa4c; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_users_user_permissions_permission_id_ed9ffa4c ON public.auth_users_user_permissions USING btree (permission_id);


--
-- Name: auth_users_user_permissions_user_id_9a4c5204; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX auth_users_user_permissions_user_id_9a4c5204 ON public.auth_users_user_permissions USING btree (user_id);


--
-- Name: django_admin_log_content_type_id_c4bce8eb; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON public.django_admin_log USING btree (content_type_id);


--
-- Name: django_admin_log_user_id_c564eba6; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX django_admin_log_user_id_c564eba6 ON public.django_admin_log USING btree (user_id);


--
-- Name: django_celery_beat_periodictask_clocked_id_47a69f82; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX django_celery_beat_periodictask_clocked_id_47a69f82 ON public.django_celery_beat_periodictask USING btree (clocked_id);


--
-- Name: django_celery_beat_periodictask_crontab_id_d3cba168; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX django_celery_beat_periodictask_crontab_id_d3cba168 ON public.django_celery_beat_periodictask USING btree (crontab_id);


--
-- Name: django_celery_beat_periodictask_interval_id_a8ca27da; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX django_celery_beat_periodictask_interval_id_a8ca27da ON public.django_celery_beat_periodictask USING btree (interval_id);


--
-- Name: django_celery_beat_periodictask_name_265a36b7_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX django_celery_beat_periodictask_name_265a36b7_like ON public.django_celery_beat_periodictask USING btree (name varchar_pattern_ops);


--
-- Name: django_celery_beat_periodictask_solar_id_a87ce72c; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX django_celery_beat_periodictask_solar_id_a87ce72c ON public.django_celery_beat_periodictask USING btree (solar_id);


--
-- Name: django_session_expire_date_a5c62663; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX django_session_expire_date_a5c62663 ON public.django_session USING btree (expire_date);


--
-- Name: django_session_session_key_c0390e0f_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX django_session_session_key_c0390e0f_like ON public.django_session USING btree (session_key varchar_pattern_ops);


--
-- Name: idx_univ_is_active; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX idx_univ_is_active ON public.universities USING btree (is_active);


--
-- Name: idx_univ_short_name; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX idx_univ_short_name ON public.universities USING btree (short_name);


--
-- Name: idx_univ_slug; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX idx_univ_slug ON public.universities USING btree (slug);


--
-- Name: idx_user_email; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX idx_user_email ON public.auth_users USING btree (email);


--
-- Name: idx_user_univ_role_active; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX idx_user_univ_role_active ON public.auth_users USING btree (university_id, role, is_active);


--
-- Name: idx_verification_user_status; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX idx_verification_user_status ON public.auth_user_verifications USING btree (user_id, status);


--
-- Name: idx_verification_user_type; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX idx_verification_user_type ON public.auth_user_verifications USING btree (user_id, verification_type);


--
-- Name: marketplace_campus__a1752a_idx; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_campus__a1752a_idx ON public.marketplace_products USING btree (campus_visibility, status);


--
-- Name: marketplace_categories_ad_type_633a54ed; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_categories_ad_type_633a54ed ON public.marketplace_categories USING btree (ad_type);


--
-- Name: marketplace_categories_ad_type_633a54ed_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_categories_ad_type_633a54ed_like ON public.marketplace_categories USING btree (ad_type varchar_pattern_ops);


--
-- Name: marketplace_categories_created_at_0b5f68c6; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_categories_created_at_0b5f68c6 ON public.marketplace_categories USING btree (created_at);


--
-- Name: marketplace_categories_deleted_at_91264c09; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_categories_deleted_at_91264c09 ON public.marketplace_categories USING btree (deleted_at);


--
-- Name: marketplace_categories_parent_id_28e0c083; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_categories_parent_id_28e0c083 ON public.marketplace_categories USING btree (parent_id);


--
-- Name: marketplace_categories_slug_4273fd8b_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_categories_slug_4273fd8b_like ON public.marketplace_categories USING btree (slug varchar_pattern_ops);


--
-- Name: marketplace_chat_id_724850_idx; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_chat_id_724850_idx ON public.marketplace_messages USING btree (chat_id, created_at);


--
-- Name: marketplace_chats_buyer_id_b28a1472; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_chats_buyer_id_b28a1472 ON public.marketplace_chats USING btree (buyer_id);


--
-- Name: marketplace_chats_created_at_c5ad66d2; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_chats_created_at_c5ad66d2 ON public.marketplace_chats USING btree (created_at);


--
-- Name: marketplace_chats_deleted_at_7d98713e; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_chats_deleted_at_7d98713e ON public.marketplace_chats USING btree (deleted_at);


--
-- Name: marketplace_chats_last_message_at_590656e0; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_chats_last_message_at_590656e0 ON public.marketplace_chats USING btree (last_message_at);


--
-- Name: marketplace_chats_product_id_b156327b; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_chats_product_id_b156327b ON public.marketplace_chats USING btree (product_id);


--
-- Name: marketplace_chats_seller_id_23a71905; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_chats_seller_id_23a71905 ON public.marketplace_chats USING btree (seller_id);


--
-- Name: marketplace_expires_72caf7_idx; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_expires_72caf7_idx ON public.marketplace_products USING btree (expires_at, status);


--
-- Name: marketplace_messages_chat_id_0d47c0ee; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_messages_chat_id_0d47c0ee ON public.marketplace_messages USING btree (chat_id);


--
-- Name: marketplace_messages_created_at_85b3b16c; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_messages_created_at_85b3b16c ON public.marketplace_messages USING btree (created_at);


--
-- Name: marketplace_messages_sender_id_7a1b4a4a; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_messages_sender_id_7a1b4a4a ON public.marketplace_messages USING btree (sender_id);


--
-- Name: marketplace_offers_buyer_id_301e04e8; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_offers_buyer_id_301e04e8 ON public.marketplace_offers USING btree (buyer_id);


--
-- Name: marketplace_offers_created_at_7f3c5000; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_offers_created_at_7f3c5000 ON public.marketplace_offers USING btree (created_at);


--
-- Name: marketplace_offers_deleted_at_cc9506a9; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_offers_deleted_at_cc9506a9 ON public.marketplace_offers USING btree (deleted_at);


--
-- Name: marketplace_offers_product_id_f0d2df42; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_offers_product_id_f0d2df42 ON public.marketplace_offers USING btree (product_id);


--
-- Name: marketplace_product_images_created_at_1753d2da; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_product_images_created_at_1753d2da ON public.marketplace_product_images USING btree (created_at);


--
-- Name: marketplace_product_images_product_id_16b501e2; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_product_images_product_id_16b501e2 ON public.marketplace_product_images USING btree (product_id);


--
-- Name: marketplace_products_campus_visibility_3a2983c8; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_products_campus_visibility_3a2983c8 ON public.marketplace_products USING btree (campus_visibility);


--
-- Name: marketplace_products_campus_visibility_3a2983c8_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_products_campus_visibility_3a2983c8_like ON public.marketplace_products USING btree (campus_visibility varchar_pattern_ops);


--
-- Name: marketplace_products_category_id_1e516680; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_products_category_id_1e516680 ON public.marketplace_products USING btree (category_id);


--
-- Name: marketplace_products_created_at_d13dfd44; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_products_created_at_d13dfd44 ON public.marketplace_products USING btree (created_at);


--
-- Name: marketplace_products_deleted_at_7f9ecb5f; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_products_deleted_at_7f9ecb5f ON public.marketplace_products USING btree (deleted_at);


--
-- Name: marketplace_products_expires_at_37c27afc; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_products_expires_at_37c27afc ON public.marketplace_products USING btree (expires_at);


--
-- Name: marketplace_products_post_type_649f5cdd; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_products_post_type_649f5cdd ON public.marketplace_products USING btree (post_type);


--
-- Name: marketplace_products_post_type_649f5cdd_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_products_post_type_649f5cdd_like ON public.marketplace_products USING btree (post_type varchar_pattern_ops);


--
-- Name: marketplace_products_reviewed_by_id_1c7cd6e4; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_products_reviewed_by_id_1c7cd6e4 ON public.marketplace_products USING btree (reviewed_by_id);


--
-- Name: marketplace_products_status_a7ae22f6; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_products_status_a7ae22f6 ON public.marketplace_products USING btree (status);


--
-- Name: marketplace_products_status_a7ae22f6_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_products_status_a7ae22f6_like ON public.marketplace_products USING btree (status varchar_pattern_ops);


--
-- Name: marketplace_products_university_id_dffc23f2; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_products_university_id_dffc23f2 ON public.marketplace_products USING btree (university_id);


--
-- Name: marketplace_products_user_id_10a1a42f; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_products_user_id_10a1a42f ON public.marketplace_products USING btree (user_id);


--
-- Name: marketplace_reports_created_at_011bfc37; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_reports_created_at_011bfc37 ON public.marketplace_reports USING btree (created_at);


--
-- Name: marketplace_reports_deleted_at_f238f2d0; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_reports_deleted_at_f238f2d0 ON public.marketplace_reports USING btree (deleted_at);


--
-- Name: marketplace_reports_product_id_1b728ee5; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_reports_product_id_1b728ee5 ON public.marketplace_reports USING btree (product_id);


--
-- Name: marketplace_reports_reporter_id_1819e8c8; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_reports_reporter_id_1819e8c8 ON public.marketplace_reports USING btree (reporter_id);


--
-- Name: marketplace_reports_reviewed_by_id_b74e134e; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_reports_reviewed_by_id_b74e134e ON public.marketplace_reports USING btree (reviewed_by_id);


--
-- Name: marketplace_reports_status_43e2e9a9; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_reports_status_43e2e9a9 ON public.marketplace_reports USING btree (status);


--
-- Name: marketplace_reports_status_43e2e9a9_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_reports_status_43e2e9a9_like ON public.marketplace_reports USING btree (status varchar_pattern_ops);


--
-- Name: marketplace_reviews_created_at_1480c1f7; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_reviews_created_at_1480c1f7 ON public.marketplace_reviews USING btree (created_at);


--
-- Name: marketplace_reviews_deleted_at_ea823e26; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_reviews_deleted_at_ea823e26 ON public.marketplace_reviews USING btree (deleted_at);


--
-- Name: marketplace_reviews_product_id_d1bde052; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_reviews_product_id_d1bde052 ON public.marketplace_reviews USING btree (product_id);


--
-- Name: marketplace_reviews_reviewer_id_5a8443e1; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_reviews_reviewer_id_5a8443e1 ON public.marketplace_reviews USING btree (reviewer_id);


--
-- Name: marketplace_reviews_seller_id_c789c9b9; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_reviews_seller_id_c789c9b9 ON public.marketplace_reviews USING btree (seller_id);


--
-- Name: marketplace_univers_3d9522_idx; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_univers_3d9522_idx ON public.marketplace_products USING btree (university_id, status, post_type);


--
-- Name: marketplace_user_id_7771c1_idx; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX marketplace_user_id_7771c1_idx ON public.marketplace_products USING btree (user_id, status);


--
-- Name: seller_badges_awarded_by_id_b779683a; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX seller_badges_awarded_by_id_b779683a ON public.seller_badges USING btree (awarded_by_id);


--
-- Name: seller_badges_created_at_9dbc2783; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX seller_badges_created_at_9dbc2783 ON public.seller_badges USING btree (created_at);


--
-- Name: seller_badges_store_id_86266f4d; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX seller_badges_store_id_86266f4d ON public.seller_badges USING btree (store_id);


--
-- Name: seller_payout_requests_created_at_53dd5a08; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX seller_payout_requests_created_at_53dd5a08 ON public.seller_payout_requests USING btree (created_at);


--
-- Name: seller_payout_requests_deleted_at_534b9b9d; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX seller_payout_requests_deleted_at_534b9b9d ON public.seller_payout_requests USING btree (deleted_at);


--
-- Name: seller_payout_requests_processed_by_id_c2bbd490; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX seller_payout_requests_processed_by_id_c2bbd490 ON public.seller_payout_requests USING btree (processed_by_id);


--
-- Name: seller_payout_requests_seller_id_5183e350; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX seller_payout_requests_seller_id_5183e350 ON public.seller_payout_requests USING btree (seller_id);


--
-- Name: seller_payout_requests_status_52e24981; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX seller_payout_requests_status_52e24981 ON public.seller_payout_requests USING btree (status);


--
-- Name: seller_payout_requests_status_52e24981_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX seller_payout_requests_status_52e24981_like ON public.seller_payout_requests USING btree (status varchar_pattern_ops);


--
-- Name: seller_prof_status_31c833_idx; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX seller_prof_status_31c833_idx ON public.seller_profiles USING btree (status, is_student_seller);


--
-- Name: seller_profiles_approved_by_id_ed979e67; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX seller_profiles_approved_by_id_ed979e67 ON public.seller_profiles USING btree (approved_by_id);


--
-- Name: seller_profiles_created_at_a55e69e9; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX seller_profiles_created_at_a55e69e9 ON public.seller_profiles USING btree (created_at);


--
-- Name: seller_profiles_deleted_at_22e3776f; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX seller_profiles_deleted_at_22e3776f ON public.seller_profiles USING btree (deleted_at);


--
-- Name: seller_profiles_status_e323c45e; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX seller_profiles_status_e323c45e ON public.seller_profiles USING btree (status);


--
-- Name: seller_profiles_status_e323c45e_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX seller_profiles_status_e323c45e_like ON public.seller_profiles USING btree (status varchar_pattern_ops);


--
-- Name: stores_approved_by_id_3b7ab3f8; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX stores_approved_by_id_3b7ab3f8 ON public.stores USING btree (approved_by_id);


--
-- Name: stores_created_at_12b73478; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX stores_created_at_12b73478 ON public.stores USING btree (created_at);


--
-- Name: stores_deleted_at_63afea1d; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX stores_deleted_at_63afea1d ON public.stores USING btree (deleted_at);


--
-- Name: stores_slug_c8d524d0_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX stores_slug_c8d524d0_like ON public.stores USING btree (slug varchar_pattern_ops);


--
-- Name: stores_status_245de046; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX stores_status_245de046 ON public.stores USING btree (status);


--
-- Name: stores_status_245de046_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX stores_status_245de046_like ON public.stores USING btree (status varchar_pattern_ops);


--
-- Name: stores_university_id_e1bfd5b6; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX stores_university_id_e1bfd5b6 ON public.stores USING btree (university_id);


--
-- Name: student_benefits_created_at_4136ae02; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX student_benefits_created_at_4136ae02 ON public.student_benefits USING btree (created_at);


--
-- Name: student_benefits_deleted_at_a00c8510; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX student_benefits_deleted_at_a00c8510 ON public.student_benefits USING btree (deleted_at);


--
-- Name: student_benefits_granted_by_id_ed62eced; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX student_benefits_granted_by_id_ed62eced ON public.student_benefits USING btree (granted_by_id);


--
-- Name: student_benefits_seller_id_44294f62; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX student_benefits_seller_id_44294f62 ON public.student_benefits USING btree (seller_id);


--
-- Name: token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX token_blacklist_outstandingtoken_jti_hex_d9bdf6f7_like ON public.token_blacklist_outstandingtoken USING btree (jti varchar_pattern_ops);


--
-- Name: token_blacklist_outstandingtoken_user_id_83bc629a; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX token_blacklist_outstandingtoken_user_id_83bc629a ON public.token_blacklist_outstandingtoken USING btree (user_id);


--
-- Name: universities_created_at_7874a6aa; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX universities_created_at_7874a6aa ON public.universities USING btree (created_at);


--
-- Name: universities_deleted_at_8ca68393; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX universities_deleted_at_8ca68393 ON public.universities USING btree (deleted_at);


--
-- Name: universities_is_active_f5867649; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX universities_is_active_f5867649 ON public.universities USING btree (is_active);


--
-- Name: universities_name_e14f6591_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX universities_name_e14f6591_like ON public.universities USING btree (name varchar_pattern_ops);


--
-- Name: universities_short_name_a75acd00_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX universities_short_name_a75acd00_like ON public.universities USING btree (short_name varchar_pattern_ops);


--
-- Name: universities_slug_c7344b51_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX universities_slug_c7344b51_like ON public.universities USING btree (slug varchar_pattern_ops);


--
-- Name: universities_system_id_700b6bcc_like; Type: INDEX; Schema: public; Owner: campushat_user
--

CREATE INDEX universities_system_id_700b6bcc_like ON public.universities USING btree (system_id varchar_pattern_ops);


--
-- Name: auth_email_verification_tokens auth_email_verificat_user_id_b858f3e8_fk_auth_user; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_email_verification_tokens
    ADD CONSTRAINT auth_email_verificat_user_id_b858f3e8_fk_auth_user FOREIGN KEY (user_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_addresses auth_user_addresses_user_id_04f87b71_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_user_addresses
    ADD CONSTRAINT auth_user_addresses_user_id_04f87b71_fk_auth_users_id FOREIGN KEY (user_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_sessions auth_user_sessions_user_id_fbf11f9e_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_user_sessions
    ADD CONSTRAINT auth_user_sessions_user_id_fbf11f9e_fk_auth_users_id FOREIGN KEY (user_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_verifications auth_user_verificati_reviewed_by_id_3125802c_fk_auth_user; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_user_verifications
    ADD CONSTRAINT auth_user_verificati_reviewed_by_id_3125802c_fk_auth_user FOREIGN KEY (reviewed_by_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_verifications auth_user_verifications_user_id_e30039ee_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_user_verifications
    ADD CONSTRAINT auth_user_verifications_user_id_e30039ee_fk_auth_users_id FOREIGN KEY (user_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_users_groups auth_users_groups_group_id_0f75702f_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_users_groups
    ADD CONSTRAINT auth_users_groups_group_id_0f75702f_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_users_groups auth_users_groups_user_id_70322499_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_users_groups
    ADD CONSTRAINT auth_users_groups_user_id_70322499_fk_auth_users_id FOREIGN KEY (user_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_users auth_users_university_id_17e6a682_fk_universities_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_users
    ADD CONSTRAINT auth_users_university_id_17e6a682_fk_universities_id FOREIGN KEY (university_id) REFERENCES public.universities(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_users_user_permissions auth_users_user_perm_permission_id_ed9ffa4c_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_users_user_permissions
    ADD CONSTRAINT auth_users_user_perm_permission_id_ed9ffa4c_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_users_user_permissions auth_users_user_permissions_user_id_9a4c5204_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.auth_users_user_permissions
    ADD CONSTRAINT auth_users_user_permissions_user_id_9a4c5204_fk_auth_users_id FOREIGN KEY (user_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_user_id_c564eba6_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_auth_users_id FOREIGN KEY (user_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_celery_beat_periodictask django_celery_beat_p_clocked_id_47a69f82_fk_django_ce; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.django_celery_beat_periodictask
    ADD CONSTRAINT django_celery_beat_p_clocked_id_47a69f82_fk_django_ce FOREIGN KEY (clocked_id) REFERENCES public.django_celery_beat_clockedschedule(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_celery_beat_periodictask django_celery_beat_p_crontab_id_d3cba168_fk_django_ce; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.django_celery_beat_periodictask
    ADD CONSTRAINT django_celery_beat_p_crontab_id_d3cba168_fk_django_ce FOREIGN KEY (crontab_id) REFERENCES public.django_celery_beat_crontabschedule(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_celery_beat_periodictask django_celery_beat_p_interval_id_a8ca27da_fk_django_ce; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.django_celery_beat_periodictask
    ADD CONSTRAINT django_celery_beat_p_interval_id_a8ca27da_fk_django_ce FOREIGN KEY (interval_id) REFERENCES public.django_celery_beat_intervalschedule(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_celery_beat_periodictask django_celery_beat_p_solar_id_a87ce72c_fk_django_ce; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.django_celery_beat_periodictask
    ADD CONSTRAINT django_celery_beat_p_solar_id_a87ce72c_fk_django_ce FOREIGN KEY (solar_id) REFERENCES public.django_celery_beat_solarschedule(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: marketplace_categories marketplace_categori_parent_id_28e0c083_fk_marketpla; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_categories
    ADD CONSTRAINT marketplace_categori_parent_id_28e0c083_fk_marketpla FOREIGN KEY (parent_id) REFERENCES public.marketplace_categories(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: marketplace_chats marketplace_chats_buyer_id_b28a1472_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_chats
    ADD CONSTRAINT marketplace_chats_buyer_id_b28a1472_fk_auth_users_id FOREIGN KEY (buyer_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: marketplace_chats marketplace_chats_product_id_b156327b_fk_marketpla; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_chats
    ADD CONSTRAINT marketplace_chats_product_id_b156327b_fk_marketpla FOREIGN KEY (product_id) REFERENCES public.marketplace_products(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: marketplace_chats marketplace_chats_seller_id_23a71905_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_chats
    ADD CONSTRAINT marketplace_chats_seller_id_23a71905_fk_auth_users_id FOREIGN KEY (seller_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: marketplace_messages marketplace_messages_chat_id_0d47c0ee_fk_marketplace_chats_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_messages
    ADD CONSTRAINT marketplace_messages_chat_id_0d47c0ee_fk_marketplace_chats_id FOREIGN KEY (chat_id) REFERENCES public.marketplace_chats(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: marketplace_messages marketplace_messages_sender_id_7a1b4a4a_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_messages
    ADD CONSTRAINT marketplace_messages_sender_id_7a1b4a4a_fk_auth_users_id FOREIGN KEY (sender_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: marketplace_offers marketplace_offers_buyer_id_301e04e8_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_offers
    ADD CONSTRAINT marketplace_offers_buyer_id_301e04e8_fk_auth_users_id FOREIGN KEY (buyer_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: marketplace_offers marketplace_offers_product_id_f0d2df42_fk_marketpla; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_offers
    ADD CONSTRAINT marketplace_offers_product_id_f0d2df42_fk_marketpla FOREIGN KEY (product_id) REFERENCES public.marketplace_products(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: marketplace_product_images marketplace_product__product_id_16b501e2_fk_marketpla; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_product_images
    ADD CONSTRAINT marketplace_product__product_id_16b501e2_fk_marketpla FOREIGN KEY (product_id) REFERENCES public.marketplace_products(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: marketplace_products marketplace_products_category_id_1e516680_fk_marketpla; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_products
    ADD CONSTRAINT marketplace_products_category_id_1e516680_fk_marketpla FOREIGN KEY (category_id) REFERENCES public.marketplace_categories(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: marketplace_products marketplace_products_reviewed_by_id_1c7cd6e4_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_products
    ADD CONSTRAINT marketplace_products_reviewed_by_id_1c7cd6e4_fk_auth_users_id FOREIGN KEY (reviewed_by_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: marketplace_products marketplace_products_university_id_dffc23f2_fk_universities_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_products
    ADD CONSTRAINT marketplace_products_university_id_dffc23f2_fk_universities_id FOREIGN KEY (university_id) REFERENCES public.universities(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: marketplace_products marketplace_products_user_id_10a1a42f_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_products
    ADD CONSTRAINT marketplace_products_user_id_10a1a42f_fk_auth_users_id FOREIGN KEY (user_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: marketplace_reports marketplace_reports_product_id_1b728ee5_fk_marketpla; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_reports
    ADD CONSTRAINT marketplace_reports_product_id_1b728ee5_fk_marketpla FOREIGN KEY (product_id) REFERENCES public.marketplace_products(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: marketplace_reports marketplace_reports_reporter_id_1819e8c8_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_reports
    ADD CONSTRAINT marketplace_reports_reporter_id_1819e8c8_fk_auth_users_id FOREIGN KEY (reporter_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: marketplace_reports marketplace_reports_reviewed_by_id_b74e134e_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_reports
    ADD CONSTRAINT marketplace_reports_reviewed_by_id_b74e134e_fk_auth_users_id FOREIGN KEY (reviewed_by_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: marketplace_reviews marketplace_reviews_product_id_d1bde052_fk_marketpla; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_reviews
    ADD CONSTRAINT marketplace_reviews_product_id_d1bde052_fk_marketpla FOREIGN KEY (product_id) REFERENCES public.marketplace_products(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: marketplace_reviews marketplace_reviews_reviewer_id_5a8443e1_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_reviews
    ADD CONSTRAINT marketplace_reviews_reviewer_id_5a8443e1_fk_auth_users_id FOREIGN KEY (reviewer_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: marketplace_reviews marketplace_reviews_seller_id_c789c9b9_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.marketplace_reviews
    ADD CONSTRAINT marketplace_reviews_seller_id_c789c9b9_fk_auth_users_id FOREIGN KEY (seller_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: seller_badges seller_badges_awarded_by_id_b779683a_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.seller_badges
    ADD CONSTRAINT seller_badges_awarded_by_id_b779683a_fk_auth_users_id FOREIGN KEY (awarded_by_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: seller_badges seller_badges_store_id_86266f4d_fk_stores_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.seller_badges
    ADD CONSTRAINT seller_badges_store_id_86266f4d_fk_stores_id FOREIGN KEY (store_id) REFERENCES public.stores(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: seller_payout_requests seller_payout_reques_processed_by_id_c2bbd490_fk_auth_user; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.seller_payout_requests
    ADD CONSTRAINT seller_payout_reques_processed_by_id_c2bbd490_fk_auth_user FOREIGN KEY (processed_by_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: seller_payout_requests seller_payout_requests_seller_id_5183e350_fk_seller_profiles_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.seller_payout_requests
    ADD CONSTRAINT seller_payout_requests_seller_id_5183e350_fk_seller_profiles_id FOREIGN KEY (seller_id) REFERENCES public.seller_profiles(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: seller_profiles seller_profiles_approved_by_id_ed979e67_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.seller_profiles
    ADD CONSTRAINT seller_profiles_approved_by_id_ed979e67_fk_auth_users_id FOREIGN KEY (approved_by_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: seller_profiles seller_profiles_user_id_72942661_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.seller_profiles
    ADD CONSTRAINT seller_profiles_user_id_72942661_fk_auth_users_id FOREIGN KEY (user_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: stores stores_approved_by_id_3b7ab3f8_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_approved_by_id_3b7ab3f8_fk_auth_users_id FOREIGN KEY (approved_by_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: stores stores_seller_id_99695f06_fk_seller_profiles_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_seller_id_99695f06_fk_seller_profiles_id FOREIGN KEY (seller_id) REFERENCES public.seller_profiles(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: stores stores_university_id_e1bfd5b6_fk_universities_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_university_id_e1bfd5b6_fk_universities_id FOREIGN KEY (university_id) REFERENCES public.universities(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: student_benefits student_benefits_granted_by_id_ed62eced_fk_auth_users_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.student_benefits
    ADD CONSTRAINT student_benefits_granted_by_id_ed62eced_fk_auth_users_id FOREIGN KEY (granted_by_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: student_benefits student_benefits_seller_id_44294f62_fk_seller_profiles_id; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.student_benefits
    ADD CONSTRAINT student_benefits_seller_id_44294f62_fk_seller_profiles_id FOREIGN KEY (seller_id) REFERENCES public.seller_profiles(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: token_blacklist_blacklistedtoken token_blacklist_blacklistedtoken_token_id_3cc7fe56_fk; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.token_blacklist_blacklistedtoken
    ADD CONSTRAINT token_blacklist_blacklistedtoken_token_id_3cc7fe56_fk FOREIGN KEY (token_id) REFERENCES public.token_blacklist_outstandingtoken(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: token_blacklist_outstandingtoken token_blacklist_outs_user_id_83bc629a_fk_auth_user; Type: FK CONSTRAINT; Schema: public; Owner: campushat_user
--

ALTER TABLE ONLY public.token_blacklist_outstandingtoken
    ADD CONSTRAINT token_blacklist_outs_user_id_83bc629a_fk_auth_user FOREIGN KEY (user_id) REFERENCES public.auth_users(id) DEFERRABLE INITIALLY DEFERRED;


--
-- PostgreSQL database dump complete
--

\unrestrict d9Pe6Gg3zwinFV0PfzM8PnW9D9b65slZeUHZN7uCNTEsPdvtd9H1eLwezl1dvrq

