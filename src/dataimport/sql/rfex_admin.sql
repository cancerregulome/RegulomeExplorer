CREATE TABLE `tcga`.`regulome_explorer_dataset`
(
   label varchar(40) PRIMARY KEY NOT NULL,
   method varchar(100),
   source varchar(100) DEFAULT TCGA,
   contact varchar(50),
   comments longtext,
   pvalue_cutoff double,
   timestamp timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
   default_display bit DEFAULT b'0' NOT NULL,
   description varchar(100),
   dataset_date varchar(30)
);

CREATE UNIQUE INDEX PRIMARY ON regulome_explorer_dataset(label);

