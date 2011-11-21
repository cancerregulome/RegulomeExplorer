
INSERT INTO mv_#REPLACE#_feature_networks 
SELECT 
f1chr, f1start, f1end, f1type, f1source, f1label, f1label_desc, 
f2chr, f2start, f2end, f2type, f2source, f2label, f2label_desc,  
alias1, alias2, feature1id, feature2id, f1genescore, f2genescore, pvalue, importance, correlation, patientct
from v_#REPLACE#_feature_networks;

commit;

