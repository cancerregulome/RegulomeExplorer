
DROP TABLE IF EXISTS #REPLACE#_features;

CREATE TABLE #REPLACE#_features
(
   id int PRIMARY KEY NOT NULL,
   alias varchar(255) NOT NULL,
   type varchar(1) NOT NULL,
   source varchar(11) NOT NULL,
   label varchar(30),
   chr varchar(10),
   start int,
   end int,
   strand int DEFAULT 0,
   label_desc varchar(50),
   patient_values longtext,
   patient_values_mean double,
   gene_interesting_score double
);

CREATE INDEX CHR ON #REPLACE#_features(chr);
CREATE INDEX ALIAS ON #REPLACE#_features(alias);
CREATE INDEX SOURCE ON #REPLACE#_features(source);
CREATE INDEX END ON #REPLACE#_features(end);
CREATE INDEX START ON #REPLACE#_features(start);
CREATE INDEX LABEL_DESC ON #REPLACE#_features(label_desc);

DROP VIEW IF EXISTS v_#REPLACE#_features;
CREATE VIEW v_#REPLACE#_features as
SELECT id, chr,start,end,strand,type,source,label,alias,gene_interesting_score,label_desc 
FROM #REPLACE#_features;

DROP VIEW IF EXISTS v_#REPLACE#_feature_clinlabel;
CREATE VIEW v_#REPLACE#_feature_clinlabel as
SELECT DISTINCT label from #REPLACE#_features where source = 'CLIN';

DROP VIEW IF EXISTS v_#REPLACE#_feature_sources;
CREATE VIEW v_#REPLACE#_feature_sources as 
SELECT distinct source from #REPLACE#_features;

DROP TABLE IF EXISTS #REPLACE#_feature_pathways;
CREATE TABLE #REPLACE#_feature_pathways
(
   featureid int not null,   
   alias varchar(100) not null,
   pathway_name varchar(50) not null,
   pathway_type varchar(30),
   pvalue double,
   id int PRIMARY KEY NOT NULL auto_increment
);

CREATE INDEX pathway_featureid ON #REPLACE#_feature_pathways(featureid);
CREATE INDEX pathway_alias ON #REPLACE#_feature_pathways(alias);
CREATE INDEX pathway_name ON #REPLACE#_feature_pathways(pathway_name);

DROP TABLE IF EXISTS #REPLACE#_association_index;
CREATE TABLE #REPLACE#_association_index
(
   featureid int not null,   
   alias varchar(50) not null,
   associated_feature_type varchar(50) not null,
   associated_index double DEFAULT 0,
   id int PRIMARY KEY NOT NULL auto_increment
);
CREATE INDEX association_index_featureid ON #REPLACE#_association_index(featureid);

DROP TABLE IF EXISTS #REPLACE#_patients;
CREATE TABLE #REPLACE#_patients
(
   barcode longtext
);

DROP VIEW IF EXISTS v_#REPLACE#_patients;
create view v_#REPLACE#_patients as select barcode from #REPLACE#_patients;

DROP TABLE IF EXISTS #REPLACE#_networks;
CREATE TABLE #REPLACE#_networks
(
   id int PRIMARY KEY NOT NULL,
   alias1 varchar(255),
   alias2 varchar(255),
   pvalue double DEFAULT 0,
   importance double DEFAULT 0,
   correlation double,
   patientct int,
   feature1id int,
   feature2id int,
   f2type varchar(1),
   f2source varchar(11),
   f2label varchar(100),   
   f2chr varchar(5),
   f2start int,   
   f2end int,
   f2strand int DEFAULT 0,
   f2label_desc varchar(50),
   f1genescore double DEFAULT 0,
   f2genescore double DEFAULT 0
);

CREATE INDEX feature1 ON #REPLACE#_networks(feature1id);
CREATE INDEX feature2 ON #REPLACE#_networks(feature2id);
CREATE INDEX alias1 ON #REPLACE#_networks(alias1);
CREATE INDEX alias2 ON #REPLACE#_networks(alias2);

DROP VIEW IF EXISTS v_#REPLACE#_patient_values;

create view v_#REPLACE#_patient_values as 
select f1.id f1id, f1.alias f1alias, f1.patient_values_mean f1mean, f1.patient_values f1values, f2.id f2id, f2.alias f2alias, 
f2.patient_values_mean f2mean, f2.patient_values f2values 
from #REPLACE#_features f1, #REPLACE#_networks n, #REPLACE#_features f2 
where f1.id = n.feature1id  
and n.feature2id = f2.id;

DROP VIEW IF EXISTS v_#REPLACE#_feature_networks;

create view v_#REPLACE#_feature_networks as 
select f.chr as f1chr, f.start as f1start, n.f2chr as f2chr, n.f2start as f2start, f.end as f1end, n.f2end as f2end, 
f.strand as f1strand, f.type as f1type, f.source as f1source, f.label as f1label, f.label_desc as f1label_desc,
n.f2strand as f2strand, n.f2type as f2type, n.f2source as f2source, n.f2label as f2label, n.f2label_desc as f2label_desc,
alias1, alias2, feature1id, feature2id, f1genescore, f2genescore, pvalue, importance, correlation, patientct 
from #REPLACE#_features f, #REPLACE#_networks n 
where f.id = n.feature1id;

DROP TABLE IF EXISTS mv_#REPLACE#_feature_networks;

CREATE TABLE mv_#REPLACE#_feature_networks (
   f1chr VARCHAR(10),
f1start int,
f1end int,
f1type VARCHAR(1),
f1source VARCHAR(11),
f1label VARCHAR(100),
f1label_desc VARCHAR(50),
f2chr VARCHAR(10),
f2start int,
f2end int,
f2type VARCHAR(1),
f2source VARCHAR(11),
f2label VARCHAR(100),
f2label_desc VARCHAR(50),
alias1 varchar(255),
alias2 varchar(255),
feature1id int,
feature2id int,
f1genescore double,
f2genescore double,
pvalue double,
importance double,
correlation double,
patientct int
);

CREATE INDEX f1chr ON mv_#REPLACE#_feature_networks(f1chr);
CREATE INDEX f1start ON mv_#REPLACE#_feature_networks(f1start);
CREATE INDEX f1end ON mv_#REPLACE#_feature_networks(f1end);
CREATE INDEX f1source ON mv_#REPLACE#_feature_networks(f1source);
CREATE INDEX f1label ON mv_#REPLACE#_feature_networks(f1label);
CREATE INDEX f1label_desc ON mv_#REPLACE#_feature_networks(f1label_desc);
CREATE INDEX f2chr ON mv_#REPLACE#_feature_networks(f2chr);
CREATE INDEX f2start ON mv_#REPLACE#_feature_networks(f2start);
CREATE INDEX f2end ON mv_#REPLACE#_feature_networks(f2end);
CREATE INDEX f2source ON mv_#REPLACE#_feature_networks(f2source);
CREATE INDEX f2label ON mv_#REPLACE#_feature_networks(f2label);
CREATE INDEX f2label_desc ON mv_#REPLACE#_feature_networks(f2label_desc);
CREATE INDEX importance ON mv_#REPLACE#_feature_networks(importance);
CREATE INDEX pvalue ON mv_#REPLACE#_feature_networks(pvalue);
CREATE INDEX correlation ON mv_#REPLACE#_feature_networks(correlation);
CREATE INDEX feature1 ON mv_#REPLACE#_feature_networks(feature1id);
CREATE INDEX feature2 ON mv_#REPLACE#_feature_networks(feature2id);
CREATE INDEX f1genescore ON mv_#REPLACE#_feature_networks(f1genescore);
CREATE INDEX f2genescore ON mv_#REPLACE#_feature_networks(f2genescore);
commit;

