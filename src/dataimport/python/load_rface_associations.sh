#!/bin/bash

#!/bin/bash
if [ $# -lt 5 ]
then
        echo arg length $#
        echo "Requires dataset_label[unique cancer_type_label_desc] feature_matrix.tsv rface_associations.tsv desc comments [optional rfex.config]"
        echo "ie sh start_load_feature_associations.sh brca-nomask_0914 /titan/cancerregulome3/TCGA/outputs/brca/brca.merge.agil.14sep.hg18.tsv /titan/cancerregulome9/workspaces/users/sreynolds/brca/rface/associations.out ov_description data_comments ./rfex.config"
        exit
fi

dataset_label=$1
feature_matrix_file=$2
associations_pw=$3
description=$4
comments=$5
config_file=rfex_sql.config
echo comments $comments desc $description

if [ $# -eq 6 ]
then
        echo Set config file to $6
        config_file=$6
fi

method="RF-ACE"
echo read in dataimport settings with $config_file $(date)
/tools/bin/python2.7 db_util.py $config_file

echo begin processing $(date) $dataset_label $feature_matrix $associations_file
/tools/bin/python2.7 createSchemaFromTemplate.py $dataset_label ../sql/create_schema_rfex_template.sql $config_file

echo begin parsing and loading features and sample values $(date) for $feature_matrix_file
/tools/bin/python2.7 parse_features_rfex.py $feature_matrix_file $dataset_label $config_file

echo begin parsing and loading network relationships
/tools/bin/python2.7 parse_associations_rfex.py $feature_matrix_file $associations_pw $dataset_label $config_file

echo parsed and loaded associations, create materialized view $(date)
/tools/bin/python2.7 createSchemaFromTemplate.py $dataset_label ../sql/populate_mv_rf_associations_template.sql $config_file
echo populated materialize view $(date)

/tools/bin/python2.7 update_rgex_dataset.py $dataset_label $feature_matrix_file $associations_pw $method "$description" "$comments" $config_file
echo registered rf dataset to regulome explorer repository, program done $(date)
echo Data import completed


