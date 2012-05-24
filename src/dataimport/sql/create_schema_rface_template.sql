DROP TABLE IF EXISTS mv_#REPLACE#_feature_networks;
CREATE TABLE mv_#REPLACE#_feature_networks
(
   alias1 varchar(255),
   alias2 varchar(255),
   pvalue double DEFAULT 0,
   importance double DEFAULT 0,
   correlation double,
   patientct int,
   feature1id int,
   f1type varchar(1),
   f1source varchar(11),
   f1label varchar(100),
   f1chr varchar(5),
   f1start int,
   f1end int,
   f1strand int DEFAULT 0,   
   f1label_desc varchar(50),
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
   f1qtinfo varchar(20) DEFAULT "",
   f2qtinfo varchar(20) DEFAULT "",
   rho_score double DEFAULT 0,
   id int AUTO_INCREMENT PRIMARY KEY NOT NULL
);

CREATE INDEX #REPLACE#_f1_f2 ON mv_#REPLACE#_feature_networks(feature1id, feature2id);
CREATE INDEX #REPLACE#_f1chr ON mv_#REPLACE#_feature_networks(f1chr);
CREATE INDEX #REPLACE#_f1start ON mv_#REPLACE#_feature_networks(f1start);
CREATE INDEX #REPLACE#_f1end ON mv_#REPLACE#_feature_networks(f1end);
CREATE INDEX #REPLACE#_f1source ON mv_#REPLACE#_feature_networks(f1source);
CREATE INDEX #REPLACE#_f1label ON mv_#REPLACE#_feature_networks(f1label);
CREATE INDEX #REPLACE#_f2chr ON mv_#REPLACE#_feature_networks(f2chr);
CREATE INDEX #REPLACE#_f2start ON mv_#REPLACE#_feature_networks(f2start);
CREATE INDEX #REPLACE#_f2end ON mv_#REPLACE#_feature_networks(f2end);
CREATE INDEX #REPLACE#_f2source ON mv_#REPLACE#_feature_networks(f2source);
CREATE INDEX #REPLACE#_f2label ON mv_#REPLACE#_feature_networks(f2label);
CREATE INDEX #REPLACE#_importance ON mv_#REPLACE#_feature_networks(importance);
CREATE INDEX #REPLACE#_pvalue ON mv_#REPLACE#_feature_networks(pvalue);
CREATE INDEX #REPLACE#_correlation ON mv_#REPLACE#_feature_networks(correlation);
CREATE INDEX #REPLACE#_feature1 ON mv_#REPLACE#_feature_networks(feature1id);
CREATE INDEX #REPLACE#_feature2 ON mv_#REPLACE#_feature_networks(feature2id);
CREATE INDEX #REPLACE#_rhoscore ON mv_#REPLACE#_feature_networks(rho_score);


DROP VIEW IF EXISTS v_#REPLACE#_patient_values;

create view v_#REPLACE#_patient_values as 
select f1.id f1id, f1.alias f1alias, f1.patient_values_mean f1mean, f1.patient_values f1values, f2.id f2id, f2.alias f2alias, 
f2.patient_values_mean f2mean, f2.patient_values f2values 
from #REPLACE#_features f1, mv_#REPLACE#_feature_networks n, #REPLACE#_features f2 
where f1.id = n.feature1id  
and n.feature2id = f2.id;

commit;

