CREATE TABLE IF NOT EXISTS regulome_explorer_dataset
(
   label varchar(40) PRIMARY KEY NOT NULL,
   method varchar(100),
   source varchar(100) DEFAULT "TCGA",
   contact varchar(50),
   comments longtext,
   pvalue_cutoff double,
   timestamp timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
   default_display varchar(10),
   description varchar(100),
   dataset_date varchar(30),
   max_logged_pvalue float DEFAULT -1.0,
   input_files varchar(255)
) ENGINE=NDBCLUSTER;

CREATE TABLE IF NOT EXISTS sample_meta (
  sample_key varchar(20) NOT NULL default "",
  cancer_type varchar(20) NOT NULL default "",
  dataset_label varchar(50) NOT NULL default "",
  matrix_col_offset int(11) default NULL,
  meta_json text,
   PRIMARY KEY (sample_key, cancer_type, dataset_label)
) ENGINE=NDBCLUSTER;

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
) ENGINE=NDBCLUSTER;

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
) ENGINE=NDBCLUSTER;

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
) ENGINE=NDBCLUSTER;
CREATE INDEX association_index_featureid ON #REPLACE#_association_index(featureid);

DROP TABLE IF EXISTS #REPLACE#_patients;
CREATE TABLE #REPLACE#_patients
(
   barcode longtext
) ENGINE=NDBCLUSTER;

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
   f2genescore double DEFAULT 0,
   rho_score double
) ENGINE=NDBCLUSTER;

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
alias1, alias2, feature1id, feature2id, f1genescore, f2genescore, pvalue, importance, correlation, patientct, rho_score 
from #REPLACE#_features f, #REPLACE#_networks n 
where f.id = n.feature1id;

commit;

