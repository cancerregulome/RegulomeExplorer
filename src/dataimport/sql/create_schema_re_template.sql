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
);

CREATE TABLE IF NOT EXISTS sample_meta (
  sample_key varchar(20) NOT NULL default "",
  cancer_type varchar(20) NOT NULL default "",
  dataset_label varchar(50) NOT NULL default "",
  matrix_col_offset int(11) default NULL,
  meta_json text,
   PRIMARY KEY (sample_key, cancer_type, dataset_label)
);

DROP TABLE IF EXISTS #REPLACE#_features;
CREATE TABLE #REPLACE#_features
(
   id int PRIMARY KEY NOT NULL,
   alias varchar(255) NOT NULL,
   type varchar(1) NOT NULL,
   source varchar(11) NOT NULL,
   label varchar(100),
   chr varchar(10),
   start int,
   end int,
   strand int DEFAULT 0,
   label_desc varchar(50),
   patient_values longtext,
   patient_values_mean double,
   interesting_score double
);

CREATE INDEX CHR ON #REPLACE#_features(chr);
CREATE INDEX ALIAS ON #REPLACE#_features(alias);
CREATE INDEX SOURCE ON #REPLACE#_features(source);
CREATE INDEX END ON #REPLACE#_features(end);
CREATE INDEX START ON #REPLACE#_features(start);
CREATE INDEX LABEL_DESC ON #REPLACE#_features(label_desc);

DROP VIEW IF EXISTS v_#REPLACE#_features;
CREATE VIEW v_#REPLACE#_features as
SELECT id, chr,start,end,strand,type,source,label,alias, interesting_score,label_desc 
FROM #REPLACE#_features;

-- DROP VIEW IF EXISTS v_#REPLACE#_feature_clinlabel;
-- CREATE VIEW v_#REPLACE#_feature_clinlabel as
-- SELECT DISTINCT label from #REPLACE#_features where source = 'CLIN';

/*replace individual categorical label tables with one label table */
DROP VIEW IF EXISTS v_#REPLACE#_feature_categorical_labels;
CREATE VIEW v_#REPLACE#_feature_categorical_labels as
SELECT DISTINCT label, alias, source, interesting_score from #REPLACE#_features where source = 'CLIN'
UNION SELECT DISTINCT label, alias, source, interesting_score from #REPLACE#_features where source = 'SAMP'
UNION SELECT DISTINCT label, alias, source, interesting_score from #REPLACE#_features where source = 'PRDM';

DROP VIEW IF EXISTS v_#REPLACE#_feature_sources;
CREATE VIEW v_#REPLACE#_feature_sources as 
SELECT distinct source from #REPLACE#_features;

DROP TABLE IF EXISTS #REPLACE#_feature_pathways;
CREATE TABLE #REPLACE#_feature_pathways
(
   featureid int not null,   
   alias varchar(255) not null,
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
   alias varchar(255) not null,
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

commit;
