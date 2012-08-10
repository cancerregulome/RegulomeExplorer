use random_forest;

create table if not exists pathway_members (psource varchar(50), pname varchar(255), purl varchar(100), pmember varchar(50), primary key(psource, pname, pmember)) ENGINE=MyISAM;

create index pathway_source on pathway_members(psource);
create index pathway_name on pathway_members(pname);
create index pathway_member on pathway_members(pmember);

create table if not exists pathways (psource varchar(50), pname varchar(255), purl varchar(100), pmembers text, primary key(psource, pname)) ENGINE=MyISAM;


