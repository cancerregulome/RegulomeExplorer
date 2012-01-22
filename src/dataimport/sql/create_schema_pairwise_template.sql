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
   max_logged_pvalue float DEFAULT -1.0
);

CREATE TABLE IF NOT EXISTS sample_meta (
  sample_key varchar(20) NOT NULL default "",
  cancer_type varchar(20) NOT NULL default "",
  dataset_label varchar(50) NOT NULL default "",
  matrix_col_offset int(11) default NULL,
  meta_json text,
  PRIMARY KEY (sample_key, cancer_type, dataset_label)
);

DROP TABLE IF EXISTS mv_#REPLACE#_feature_networks;
CREATE TABLE mv_#REPLACE#_feature_networks
(
   alias1 varchar(255) NOT NULL,
   f1type varchar(1) NOT NULL,
   f1source varchar(11) NOT NULL,
   f1label varchar(30),
   f1chr varchar(10),
   f1start int,
   f1end int,
   f1strand int DEFAULT 0,
   f1label_desc varchar(50),
   alias2 varchar(255) NOT NULL,
   f2type varchar(1) NOT NULL,
   f2source varchar(11) NOT NULL,
   f2label varchar(30),
   f2chr varchar(10),
   f2start int,
   f2end int,
   f2strand int DEFAULT 0,
   f2label_desc varchar(50),
   correlation double,
   num_nonna int,
   logged_pvalue double,
   bonf_fac double,
   logged_pvalue_bonf double,   
   num_nonna_f1 int,
   logged_pvalue_f1 double,
   num_nonna_f2 int,
   logged_pvalue_f2 double,
   id int AUTO_INCREMENT PRIMARY KEY NOT NULL
);

CREATE INDEX #REPLACE#_pw_source1 ON mv_#REPLACE#_feature_networks(f1source);
CREATE INDEX #REPLACE#_pw_source2 ON mv_#REPLACE#_feature_networks(f2source);
CREATE INDEX #REPLACE#_pw_label1 ON mv_#REPLACE#_feature_networks(f1label);
CREATE INDEX #REPLACE#_pw_label2 ON mv_#REPLACE#_feature_networks(f2label);
CREATE INDEX #REPLACE#_pw_loggedpv ON mv_#REPLACE#_feature_networks(logged_pvalue);

DROP VIEW IF EXISTS #REPLACE#_clinical_features;
CREATE VIEW #REPLACE#_clinical_features
as
SELECT 
distinct label
FROM 
#REPLACE#_features
where 
(source = "CLIN" or source = "SAMP");

