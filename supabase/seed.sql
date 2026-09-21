-- Representative seed data for the SpikeOS schema.
--
-- This is NOT what the running API currently reads from (DATA_SOURCE=mock
-- uses backend/app/mock/generator.py, entirely in-process). This seed
-- exists so `supabase db reset` gives you a populated database to explore
-- in Supabase Studio, and so the schema can be exercised directly with
-- SQL, ahead of the backend actually being wired to Postgres.

begin;

insert into organizations (id, name) values
    ('00000000-0000-0000-0000-000000000001', 'Spike Electric');

insert into departments (id, organization_id, name) values
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Operations'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Sales'),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Finance'),
    ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Engineering'),
    ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Customer Success'),
    ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Marketing'),
    ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'HR');

-- Hero team: Sarah Williams (Operations Manager) and her four direct reports.
insert into employees (id, organization_id, department_id, manager_id, name, title, email, avatar_color, response_score, median_response_minutes, answered_within_24h_pct, positive_communication_pct, overdue_follow_ups, open_commitments, sla_compliance_pct) values
    ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', null, 'Sarah Williams', 'Operations Manager', 'sarah.williams@spikeelectric.com', '#2F6BFF', 91, 252, 93, 92, 7, 5, 94);

insert into employees (id, organization_id, department_id, manager_id, name, title, email, avatar_color, response_score, median_response_minutes, answered_within_24h_pct, positive_communication_pct, overdue_follow_ups, open_commitments, sla_compliance_pct) values
    ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Alex Johnson', 'Operations Coordinator', 'alex.johnson@spikeelectric.com', '#7C5CFF', 85, 210, 78, 97, 1, 4, 92),
    ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Michael Brown', 'Field Service Lead', 'michael.brown@spikeelectric.com', '#0EA5A5', 88, 190, 90, 89, 2, 3, 91),
    ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Daniel Carter', 'Operations Analyst', 'daniel.carter@spikeelectric.com', '#B5650A', 79, 340, 82, 85, 3, 2, 87),
    ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Emily Davis', 'Operations Coordinator', 'emily.davis@spikeelectric.com', '#C53434', 93, 150, 96, 94, 1, 3, 96);

-- Department managers.
insert into employees (id, organization_id, department_id, manager_id, name, title, email, avatar_color, response_score, median_response_minutes, answered_within_24h_pct, positive_communication_pct, overdue_follow_ups, open_commitments, sla_compliance_pct) values
    ('20000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', null, 'Priya Nkemelu', 'Sales Manager', 'priya.nkemelu@spikeelectric.com', '#157A4A', 87, 220, 88, 90, 2, 4, 90),
    ('20000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', null, 'Marcus Diallo', 'Finance Manager', 'marcus.diallo@spikeelectric.com', '#5B6B8C', 90, 200, 91, 88, 1, 2, 93),
    ('20000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', null, 'Ines Fon', 'Engineering Manager', 'ines.fon@spikeelectric.com', '#2F6BFF', 89, 230, 87, 91, 2, 5, 89),
    ('20000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', null, 'Kwame Achu', 'Customer Success Manager', 'kwame.achu@spikeelectric.com', '#0EA5A5', 92, 180, 94, 93, 1, 3, 95),
    ('20000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', null, 'Lerato Ngu', 'Marketing Manager', 'lerato.ngu@spikeelectric.com', '#7C5CFF', 84, 260, 83, 86, 3, 2, 86),
    ('20000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000007', null, 'Thabo Njoya', 'HR Manager', 'thabo.njoya@spikeelectric.com', '#B5650A', 88, 240, 89, 90, 1, 2, 91);

-- A handful of additional employees across departments (representative
-- sample — the running mock API generates the full ~600).
insert into employees (id, organization_id, department_id, manager_id, name, title, email, avatar_color, response_score, median_response_minutes, answered_within_24h_pct, positive_communication_pct, overdue_follow_ups, open_commitments, sla_compliance_pct)
select
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    d.id,
    m.id,
    names.name,
    names.title,
    lower(replace(names.name, ' ', '.')) || '@spikeelectric.com',
    colors.color,
    70 + (row_number() over () * 7 % 28),
    120 + (row_number() over () * 37 % 480),
    78 + (row_number() over () * 5 % 20),
    75 + (row_number() over () * 3 % 22),
    (row_number() over () % 4),
    (row_number() over () % 6),
    82 + (row_number() over () * 2 % 17)
from (values
    ('Ngozi Okafor', 'Account Executive', 'Sales'),
    ('Chidi Traore', 'Sales Development Rep', 'Sales'),
    ('Amara Kone', 'Financial Analyst', 'Finance'),
    ('Victor Osei', 'AP/AR Specialist', 'Finance'),
    ('Grace Adeyemi', 'Systems Engineer', 'Engineering'),
    ('Elias Fru', 'Electrical Engineer', 'Engineering'),
    ('Nadia Wirba', 'Support Specialist', 'Customer Success'),
    ('Tunde Ateba', 'Onboarding Lead', 'Customer Success'),
    ('Zara Bennett', 'Brand Manager', 'Marketing'),
    ('Liam Hayes', 'Content Strategist', 'Marketing'),
    ('Mei Morrison', 'Recruiter', 'HR'),
    ('Dara Price', 'People Operations Analyst', 'HR')
) as names(name, title, department)
join departments d on d.name = names.department and d.organization_id = '00000000-0000-0000-0000-000000000001'
join employees m on m.department_id = d.id and m.manager_id is null
cross join (values ('#2F6BFF'), ('#7C5CFF'), ('#0EA5A5'), ('#B5650A'), ('#C53434'), ('#157A4A')) as colors(color)
limit 12;

insert into users (employee_id, account_type, privilege_level) values
    ('20000000-0000-0000-0000-000000000001', 'employee', 'manager'),
    ('20000000-0000-0000-0000-000000000002', 'employee', 'standard'),
    ('20000000-0000-0000-0000-000000000003', 'employee', 'standard'),
    ('20000000-0000-0000-0000-000000000004', 'employee', 'standard'),
    ('20000000-0000-0000-0000-000000000005', 'employee', 'standard');
insert into users (account_type, privilege_level) values ('administrator', 'manager');

insert into customers (organization_id, name, industry, health) values
    ('00000000-0000-0000-0000-000000000001', 'Apex Manufacturing', 'Industrial Manufacturing', 'strong'),
    ('00000000-0000-0000-0000-000000000001', 'Northstar Logistics', 'Logistics & Distribution', 'steady'),
    ('00000000-0000-0000-0000-000000000001', 'Global Industrial Supply', 'Industrial Manufacturing', 'strong'),
    ('00000000-0000-0000-0000-000000000001', 'Vertex Energy', 'Energy Production', 'at_risk'),
    ('00000000-0000-0000-0000-000000000001', 'Meridian Systems', 'Rail & Transit', 'steady'),
    ('00000000-0000-0000-0000-000000000001', 'Ironclad Fabrication', 'Materials & Fabrication', 'strong');

insert into scoring_rules (organization_id, label, value) values
    ('00000000-0000-0000-0000-000000000001', 'Customer response target', '24 hours'),
    ('00000000-0000-0000-0000-000000000001', 'Internal response target', '48 hours'),
    ('00000000-0000-0000-0000-000000000001', 'High priority target', '4 hours'),
    ('00000000-0000-0000-0000-000000000001', 'Commitment follow-up', 'Required');

insert into exclusion_rules (organization_id, label, description, rule, enabled) values
    ('00000000-0000-0000-0000-000000000001', 'Automated messages', 'System-generated notifications with no expected reply.', 'Sender domain matches known automation systems.', true),
    ('00000000-0000-0000-0000-000000000001', 'Newsletters', 'Bulk marketing or informational sends.', 'Message contains unsubscribe/list-header metadata.', true),
    ('00000000-0000-0000-0000-000000000001', 'Distribution lists', 'Messages sent to broad internal groups.', 'Recipient is a distribution list, not an individual.', true),
    ('00000000-0000-0000-0000-000000000001', 'FYI messages', 'Messages explicitly marked informational only.', 'Subject or body indicates no response is required.', true),
    ('00000000-0000-0000-0000-000000000001', 'Approved PTO', 'Time when the employee was on approved leave.', 'Message received during an approved PTO window.', true),
    ('00000000-0000-0000-0000-000000000001', 'Delegated coverage', 'Time when another employee covered communications.', 'Delegate acknowledged on the employee''s behalf.', true),
    ('00000000-0000-0000-0000-000000000001', 'System-generated messages', 'Messages originating from internal tooling.', 'Sender is a recognized system account.', true),
    ('00000000-0000-0000-0000-000000000001', 'Not reasonably requiring a response', 'Content that does not require action.', 'AI classification confidence exceeds threshold, subject to review.', false);

insert into integration_status (organization_id, name, status, description) values
    ('00000000-0000-0000-0000-000000000001', 'Microsoft 365', 'mock_mode', 'Source of communication and calendar records.'),
    ('00000000-0000-0000-0000-000000000001', 'Microsoft Graph', 'not_configured', 'Secure, permissioned access to Microsoft 365 data.'),
    ('00000000-0000-0000-0000-000000000001', 'Microsoft Entra ID', 'not_configured', 'Future authentication provider.'),
    ('00000000-0000-0000-0000-000000000001', 'Power BI', 'mock_mode', 'Powers embedded analytics inside SpikeOS.'),
    ('00000000-0000-0000-0000-000000000001', 'AI Provider', 'mock_mode', 'Communication quality and coaching intelligence.');

insert into reports (organization_id, key, title, description) values
    ('00000000-0000-0000-0000-000000000001', 'weekly-communication', 'Weekly Communication Report', 'A rolling summary of response performance and outstanding work.'),
    ('00000000-0000-0000-0000-000000000001', 'monthly-executive', 'Monthly Executive Report', 'Organization-wide performance for leadership review.'),
    ('00000000-0000-0000-0000-000000000001', 'team-performance', 'Team Performance Report', 'Manager-facing summary of team response and quality metrics.'),
    ('00000000-0000-0000-0000-000000000001', 'response-sla', 'Response SLA Report', 'SLA compliance by department and priority tier.'),
    ('00000000-0000-0000-0000-000000000001', 'commitment', 'Commitment Report', 'Open, completed, and overdue commitments across the organization.'),
    ('00000000-0000-0000-0000-000000000001', 'ai-coaching', 'AI Coaching Report', 'A summary of AI-assisted coaching insights and their review status.');

insert into audit_logs (organization_id, actor_label, action, resource, result, ip_address) values
    ('00000000-0000-0000-0000-000000000001', 'Sarah Williams', 'Reviewed AI finding', 'Communication comm-7', 'success', '10.20.4.18'),
    ('00000000-0000-0000-0000-000000000001', 'System Administrator', 'Changed scoring rule', 'Settings / Scoring — Customer response target', 'success', '10.20.1.2'),
    ('00000000-0000-0000-0000-000000000001', 'Alex Johnson', 'Submitted context', 'Evidence ev-1', 'success', '10.20.6.44');

commit;
