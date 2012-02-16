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

INSERT INTO mv_#REPLACE#_feature_networks 
SELECT 
f1chr, f1start, f1end, f1type, f1source, f1label, f1label_desc, 
f2chr, f2start, f2end, f2type, f2source, f2label, f2label_desc,  
alias1, alias2, feature1id, feature2id, f1genescore, f2genescore, pvalue, importance, correlation, patientct
from v_#REPLACE#_feature_networks;

commit;

