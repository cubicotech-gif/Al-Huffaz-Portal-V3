-- 0009_behavior_ratings.sql
-- v2 parity: the behaviour rubric fields (homework, class participation,
-- group work, problem solving, organization) are 1-5 star ratings, not
-- text labels. Convert the columns to smallint. Safe at this stage since
-- no production behaviour data is yet in place.

alter table student_behavior
  alter column homework_completion drop default,
  alter column homework_completion type smallint using null,
  alter column class_participation drop default,
  alter column class_participation type smallint using null,
  alter column group_work drop default,
  alter column group_work type smallint using null,
  alter column problem_solving drop default,
  alter column problem_solving type smallint using null,
  alter column organization drop default,
  alter column organization type smallint using null;

alter table student_behavior
  add constraint student_behavior_homework_range
    check (homework_completion is null or homework_completion between 1 and 5),
  add constraint student_behavior_class_range
    check (class_participation is null or class_participation between 1 and 5),
  add constraint student_behavior_group_range
    check (group_work is null or group_work between 1 and 5),
  add constraint student_behavior_problem_range
    check (problem_solving is null or problem_solving between 1 and 5),
  add constraint student_behavior_organization_range
    check (organization is null or organization between 1 and 5);
