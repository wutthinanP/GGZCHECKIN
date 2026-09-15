--
-- PostgreSQL database dump
--

\restrict vfh8oKSMxAubxAcxowWpRylUVvmojgarxD1suViBVKDRn61PmgaOC9rX9n9xU8a

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    work_date date NOT NULL,
    check_in_at timestamp with time zone,
    check_out_at timestamp with time zone,
    check_in_latitude numeric(10,7),
    check_in_longitude numeric(10,7),
    check_in_accuracy numeric(10,2),
    check_out_latitude numeric(10,7),
    check_out_longitude numeric(10,7),
    check_out_accuracy numeric(10,2),
    check_in_selfie text,
    check_out_selfie text,
    late_minutes integer DEFAULT 0 NOT NULL,
    worked_minutes integer DEFAULT 0 NOT NULL,
    overtime_minutes integer DEFAULT 0 NOT NULL,
    status character varying(30) DEFAULT 'not_checked_in'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT attendance_late_minutes_check CHECK ((late_minutes >= 0)),
    CONSTRAINT attendance_overtime_minutes_check CHECK ((overtime_minutes >= 0)),
    CONSTRAINT attendance_status_check CHECK (((status)::text = ANY ((ARRAY['not_checked_in'::character varying, 'present'::character varying, 'late'::character varying, 'absent'::character varying, 'leave'::character varying, 'wfh'::character varying, 'holiday'::character varying])::text[]))),
    CONSTRAINT attendance_worked_minutes_check CHECK ((worked_minutes >= 0))
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- Name: attendance_edit_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_edit_requests (
    id bigint NOT NULL,
    attendance_id bigint NOT NULL,
    user_id bigint NOT NULL,
    requested_check_in_at timestamp with time zone,
    requested_check_out_at timestamp with time zone,
    reason text NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    reviewed_by bigint,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT attendance_edit_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.attendance_edit_requests OWNER TO postgres;

--
-- Name: attendance_edit_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_edit_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_edit_requests_id_seq OWNER TO postgres;

--
-- Name: attendance_edit_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_edit_requests_id_seq OWNED BY public.attendance_edit_requests.id;


--
-- Name: attendance_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance_events (
    id bigint NOT NULL,
    attendance_id bigint NOT NULL,
    user_id bigint NOT NULL,
    event_type character varying(30) NOT NULL,
    event_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    latitude numeric(10,7),
    longitude numeric(10,7),
    accuracy numeric(10,2),
    selfie text,
    ip_address inet,
    user_agent text,
    note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT attendance_events_event_type_check CHECK (((event_type)::text = ANY ((ARRAY['check_in'::character varying, 'break_start'::character varying, 'break_end'::character varying, 'check_out'::character varying, 'ot_start'::character varying, 'manual_adjust'::character varying])::text[])))
);


ALTER TABLE public.attendance_events OWNER TO postgres;

--
-- Name: attendance_events_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_events_id_seq OWNER TO postgres;

--
-- Name: attendance_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_events_id_seq OWNED BY public.attendance_events.id;


--
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_id_seq OWNER TO postgres;

--
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    user_id bigint,
    action character varying(100) NOT NULL,
    entity_type character varying(100),
    entity_id bigint,
    old_data jsonb,
    new_data jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO postgres;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_requests (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    leave_type_id integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    approved_by bigint,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT leave_requests_check CHECK ((end_date >= start_date)),
    CONSTRAINT leave_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.leave_requests OWNER TO postgres;

--
-- Name: leave_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_requests_id_seq OWNER TO postgres;

--
-- Name: leave_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_requests_id_seq OWNED BY public.leave_requests.id;


--
-- Name: leave_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_types (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_paid boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.leave_types OWNER TO postgres;

--
-- Name: leave_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_types_id_seq OWNER TO postgres;

--
-- Name: leave_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_types_id_seq OWNED BY public.leave_types.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    read_at timestamp with time zone
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: schedule_breaks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schedule_breaks (
    id bigint NOT NULL,
    schedule_id bigint NOT NULL,
    name character varying(100) NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    is_paid boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.schedule_breaks OWNER TO postgres;

--
-- Name: schedule_breaks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schedule_breaks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schedule_breaks_id_seq OWNER TO postgres;

--
-- Name: schedule_breaks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schedule_breaks_id_seq OWNED BY public.schedule_breaks.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    employee_code character varying(50) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    role_id integer NOT NULL,
    schedule_id bigint,
    department character varying(100),
    "position" character varying(100),
    phone character varying(30),
    avatar text,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: wfh_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.wfh_requests (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    approved_by bigint,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT wfh_requests_check CHECK ((end_date >= start_date)),
    CONSTRAINT wfh_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.wfh_requests OWNER TO postgres;

--
-- Name: wfh_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.wfh_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.wfh_requests_id_seq OWNER TO postgres;

--
-- Name: wfh_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.wfh_requests_id_seq OWNED BY public.wfh_requests.id;


--
-- Name: work_schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_schedules (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    grace_period_minutes integer DEFAULT 0 NOT NULL,
    overtime_enabled boolean DEFAULT true NOT NULL,
    overtime_start_time time without time zone,
    minimum_overtime_minutes integer DEFAULT 0 NOT NULL,
    overtime_rounding_minutes integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT work_schedules_grace_period_minutes_check CHECK ((grace_period_minutes >= 0)),
    CONSTRAINT work_schedules_minimum_overtime_minutes_check CHECK ((minimum_overtime_minutes >= 0)),
    CONSTRAINT work_schedules_overtime_rounding_minutes_check CHECK ((overtime_rounding_minutes > 0))
);


ALTER TABLE public.work_schedules OWNER TO postgres;

--
-- Name: work_schedules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.work_schedules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.work_schedules_id_seq OWNER TO postgres;

--
-- Name: work_schedules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.work_schedules_id_seq OWNED BY public.work_schedules.id;


--
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- Name: attendance_edit_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_edit_requests ALTER COLUMN id SET DEFAULT nextval('public.attendance_edit_requests_id_seq'::regclass);


--
-- Name: attendance_events id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_events ALTER COLUMN id SET DEFAULT nextval('public.attendance_events_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: leave_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests ALTER COLUMN id SET DEFAULT nextval('public.leave_requests_id_seq'::regclass);


--
-- Name: leave_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types ALTER COLUMN id SET DEFAULT nextval('public.leave_types_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: schedule_breaks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_breaks ALTER COLUMN id SET DEFAULT nextval('public.schedule_breaks_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: wfh_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfh_requests ALTER COLUMN id SET DEFAULT nextval('public.wfh_requests_id_seq'::regclass);


--
-- Name: work_schedules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_schedules ALTER COLUMN id SET DEFAULT nextval('public.work_schedules_id_seq'::regclass);


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance (id, user_id, work_date, check_in_at, check_out_at, check_in_latitude, check_in_longitude, check_in_accuracy, check_out_latitude, check_out_longitude, check_out_accuracy, check_in_selfie, check_out_selfie, late_minutes, worked_minutes, overtime_minutes, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: attendance_edit_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance_edit_requests (id, attendance_id, user_id, requested_check_in_at, requested_check_out_at, reason, status, reviewed_by, reviewed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: attendance_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance_events (id, attendance_id, user_id, event_type, event_at, latitude, longitude, accuracy, selfie, ip_address, user_agent, note, created_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_requests (id, user_id, leave_type_id, start_date, end_date, reason, status, approved_by, approved_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: leave_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_types (id, name, description, is_paid, is_active, created_at) FROM stdin;
1	ลาป่วย	ลาป่วย	t	t	2026-08-18 15:07:03.378247+07
2	ลากิจ	ลากิจส่วนตัว	f	t	2026-08-18 15:07:03.378247+07
3	ลาพักร้อน	ลาพักร้อน	t	t	2026-08-18 15:07:03.378247+07
4	ลาอื่นๆ	ประเภทการลาอื่นๆ	f	t	2026-08-18 15:07:03.378247+07
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, title, message, is_read, created_at, read_at) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, created_at) FROM stdin;
1	employee	2026-08-18 15:07:03.378247+07
2	manager	2026-08-18 15:07:03.378247+07
3	admin	2026-08-18 15:07:03.378247+07
4	super_admin	2026-08-18 15:07:03.378247+07
\.


--
-- Data for Name: schedule_breaks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schedule_breaks (id, schedule_id, name, start_time, end_time, is_paid, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, employee_code, first_name, last_name, email, password_hash, role_id, schedule_id, department, "position", phone, avatar, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: wfh_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.wfh_requests (id, user_id, start_date, end_date, reason, status, approved_by, approved_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: work_schedules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.work_schedules (id, name, start_time, end_time, grace_period_minutes, overtime_enabled, overtime_start_time, minimum_overtime_minutes, overtime_rounding_minutes, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Name: attendance_edit_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_edit_requests_id_seq', 1, false);


--
-- Name: attendance_events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_events_id_seq', 1, false);


--
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_id_seq', 1, false);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: leave_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_requests_id_seq', 1, false);


--
-- Name: leave_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_types_id_seq', 4, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);


--
-- Name: schedule_breaks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schedule_breaks_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, false);


--
-- Name: wfh_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.wfh_requests_id_seq', 1, false);


--
-- Name: work_schedules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.work_schedules_id_seq', 1, false);


--
-- Name: attendance_edit_requests attendance_edit_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_edit_requests
    ADD CONSTRAINT attendance_edit_requests_pkey PRIMARY KEY (id);


--
-- Name: attendance_events attendance_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_events
    ADD CONSTRAINT attendance_events_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_user_id_work_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_user_id_work_date_key UNIQUE (user_id, work_date);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- Name: leave_types leave_types_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_name_key UNIQUE (name);


--
-- Name: leave_types leave_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_types
    ADD CONSTRAINT leave_types_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: schedule_breaks schedule_breaks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_breaks
    ADD CONSTRAINT schedule_breaks_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_employee_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_employee_code_key UNIQUE (employee_code);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wfh_requests wfh_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfh_requests
    ADD CONSTRAINT wfh_requests_pkey PRIMARY KEY (id);


--
-- Name: work_schedules work_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_schedules
    ADD CONSTRAINT work_schedules_pkey PRIMARY KEY (id);


--
-- Name: idx_attendance_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_date ON public.attendance USING btree (work_date);


--
-- Name: idx_attendance_edit_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_edit_requests_status ON public.attendance_edit_requests USING btree (status);


--
-- Name: idx_attendance_events_attendance; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_events_attendance ON public.attendance_events USING btree (attendance_id);


--
-- Name: idx_attendance_events_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_events_time ON public.attendance_events USING btree (event_at);


--
-- Name: idx_attendance_events_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_events_user ON public.attendance_events USING btree (user_id);


--
-- Name: idx_attendance_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_status ON public.attendance USING btree (status);


--
-- Name: idx_attendance_user_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_user_date ON public.attendance USING btree (user_id, work_date);


--
-- Name: idx_audit_logs_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: idx_audit_logs_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user ON public.audit_logs USING btree (user_id);


--
-- Name: idx_leave_requests_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_requests_dates ON public.leave_requests USING btree (start_date, end_date);


--
-- Name: idx_leave_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_requests_status ON public.leave_requests USING btree (status);


--
-- Name: idx_leave_requests_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_requests_user ON public.leave_requests USING btree (user_id);


--
-- Name: idx_notifications_unread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_unread ON public.notifications USING btree (user_id, is_read);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- Name: idx_users_department; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_department ON public.users USING btree (department);


--
-- Name: idx_users_role_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role_id ON public.users USING btree (role_id);


--
-- Name: idx_users_schedule_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_schedule_id ON public.users USING btree (schedule_id);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- Name: idx_wfh_requests_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wfh_requests_dates ON public.wfh_requests USING btree (start_date, end_date);


--
-- Name: idx_wfh_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wfh_requests_status ON public.wfh_requests USING btree (status);


--
-- Name: idx_wfh_requests_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_wfh_requests_user ON public.wfh_requests USING btree (user_id);


--
-- Name: attendance_edit_requests attendance_edit_requests_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER attendance_edit_requests_updated_at BEFORE UPDATE ON public.attendance_edit_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: leave_requests leave_requests_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER leave_requests_updated_at BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: users users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: wfh_requests wfh_requests_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER wfh_requests_updated_at BEFORE UPDATE ON public.wfh_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: work_schedules work_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER work_schedules_updated_at BEFORE UPDATE ON public.work_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: attendance_edit_requests attendance_edit_requests_attendance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_edit_requests
    ADD CONSTRAINT attendance_edit_requests_attendance_id_fkey FOREIGN KEY (attendance_id) REFERENCES public.attendance(id) ON DELETE CASCADE;


--
-- Name: attendance_edit_requests attendance_edit_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_edit_requests
    ADD CONSTRAINT attendance_edit_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: attendance_edit_requests attendance_edit_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_edit_requests
    ADD CONSTRAINT attendance_edit_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: attendance_events attendance_events_attendance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_events
    ADD CONSTRAINT attendance_events_attendance_id_fkey FOREIGN KEY (attendance_id) REFERENCES public.attendance(id) ON DELETE CASCADE;


--
-- Name: attendance_events attendance_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance_events
    ADD CONSTRAINT attendance_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: attendance attendance_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: leave_requests leave_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: leave_requests leave_requests_leave_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_leave_type_id_fkey FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id);


--
-- Name: leave_requests leave_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: schedule_breaks schedule_breaks_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_breaks
    ADD CONSTRAINT schedule_breaks_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.work_schedules(id) ON DELETE CASCADE;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: users users_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.work_schedules(id) ON DELETE SET NULL;


--
-- Name: wfh_requests wfh_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfh_requests
    ADD CONSTRAINT wfh_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: wfh_requests wfh_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.wfh_requests
    ADD CONSTRAINT wfh_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict vfh8oKSMxAubxAcxowWpRylUVvmojgarxD1suViBVKDRn61PmgaOC9rX9n9xU8a

