DROP TABLE IF EXISTS mv_#REPLACE#_feature_networks;
CREATE TABLE mv_#REPLACE#_feature_networks
(
   feature1id int,
   feature2id int,   
   alias1 varchar(255) NOT NULL,
   f1type varchar(1) NOT NULL,
   f1source varchar(11) NOT NULL,
   f1label varchar(100),
   f1chr varchar(10),
   f1start int,
   f1end int,
   f1strand int DEFAULT 0,
   f1label_desc varchar(50),
   alias2 varchar(255) NOT NULL,
   f2type varchar(1) NOT NULL,
   f2source varchar(11) NOT NULL,
   f2label varchar(100),
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
   rho_score double,
   f1qtinfo varchar(20) DEFAULT "",
   f2qtinfo varchar(20) DEFAULT "",
   id int AUTO_INCREMENT PRIMARY KEY NOT NULL
);

CREATE INDEX #REPLACE#_f1_f2 ON mv_#REPLACE#_feature_networks(feature1id, feature2id);
CREATE INDEX #REPLACE#_source1 ON mv_#REPLACE#_feature_networks(f1source);
CREATE INDEX #REPLACE#_source2 ON mv_#REPLACE#_feature_networks(f2source);
CREATE INDEX #REPLACE#_label1 ON mv_#REPLACE#_feature_networks(f1label);
CREATE INDEX #REPLACE#_label2 ON mv_#REPLACE#_feature_networks(f2label);
CREATE INDEX #REPLACE#_loggedpv ON mv_#REPLACE#_feature_networks(logged_pvalue);
CREATE INDEX #REPLACE#_rhoscore ON mv_#REPLACE#_feature_networks(rho_score);
CREATE INDEX #REPLACE#_composite1 ON mv_#REPLACE#_feature_networks(f2source, logged_pvalue);

DROP VIEW IF EXISTS #REPLACE#_clinical_features;
CREATE VIEW #REPLACE#_clinical_features
as
SELECT 
distinct label
FROM 
#REPLACE#_features
where 
(source = "CLIN" or source = "SAMP");

DROP VIEW IF EXISTS v_#REPLACE#_patient_values;

create view v_#REPLACE#_patient_values as
select f1.id f1id, f1.alias f1alias, f1.patient_values_mean f1mean, f1.patient_values f1values, f2.id f2id, f2.alias f2alias,
f2.patient_values_mean f2mean, f2.patient_values f2values
from #REPLACE#_features f1, mv_#REPLACE#_feature_networks n, #REPLACE#_features f2
where f1.id = n.feature1id
and n.feature2id = f2.id;

commit;
