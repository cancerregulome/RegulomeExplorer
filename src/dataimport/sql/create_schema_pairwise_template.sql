DROP TABLE IF EXISTS #REPLACE#_pw;

CREATE TABLE #REPLACE#_pw
(
   alias1 varchar(255) NOT NULL,
   type1 varchar(1) NOT NULL,
   source1 varchar(11) NOT NULL,
   label1 varchar(30),
   chr1 varchar(10),
   start1 int,
   end1 int,
   strand1 int DEFAULT 0,
   label1_desc varchar(50),
   alias2 varchar(255) NOT NULL,
   type2 varchar(1) NOT NULL,
   source2 varchar(11) NOT NULL,
   label2 varchar(30),
   chr2 varchar(10),
   start2 int,
   end2 int,
   strand2 int DEFAULT 0,
   label2_desc varchar(50),
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

CREATE INDEX #REPLACE#_pw_source1 ON #REPLACE#_pw(source1);
CREATE INDEX #REPLACE#_pw_source2 ON #REPLACE#_pw(source2);
CREATE INDEX #REPLACE#_pw_label1 ON #REPLACE#_pw(label1);
CREATE INDEX #REPLACE#_pw_label2 ON #REPLACE#_pw(label2);

DROP VIEW IF EXISTS #REPLACE#_pw_clinical_features;

create view #REPLACE#_pw_clinical_features
as
SELECT 
distinct label
FROM 
#REPLACE#_features
where 
(source = "CLIN" or source = "SAMP");

