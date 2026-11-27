-- allow reporting reels (and job posts, used by the jobs section later)
alter table reports drop constraint if exists reports_kind_check;
alter table reports add constraint reports_kind_check check(kind in('post','message','dm','group','service','office','property','review','comment','page','page_post','market','reel','job'));
