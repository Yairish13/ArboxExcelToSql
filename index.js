const readXlsxFile = require("read-excel-file/node");
const mysql = require("mysql");
const myFunctions = require('./utils')


const { idGenerator, formatDate, hasDuplicates } = myFunctions;

//To change the excel file just change the path.
const fileSrc = "./resources/jimalaya.xlsx";
const newClientsClubId = 2400;
let emailsArr = [];

// Create a connection to the database
const connection = mysql.createConnection({
  host: "localhost",
  user: "Arbox",
  password: "123123123",
  database: "ar_db",
});

const getValuesOfObjByArrOfProperties = (exel,arr)=>exel.map((obj)=>arr.reduce((acc,curr)=>({...acc,[curr]:obj[curr]}),{}))

// File path.
try {
  readXlsxFile(fileSrc).then((rows) => {
    //Here I got rows of cells from the excel (just modify here specific headers)
    let data = [...rows];
    const fieldsToFormat = {"start_date":formatDate, "end_date":formatDate};

    const headers = [...data[0]];
    data.splice(0, 1);
    data = data.filter(
      (arr) =>
        arr.reduce((acc, curr) => (!!curr ? acc : acc + 1), 0) !== arr.length
    );
    const exel = data.reduce(
      (acc, curr) => {
        const newUserId = idGenerator()
        return [
        ...acc,
        curr.reduce((cAcc, cCurr, i) => {
          const needToFormat = Object.keys(fieldsToFormat).find((f) =>
            headers[i].includes(f)
          );
          return { ...cAcc, [needToFormat ? needToFormat : headers[i]]:needToFormat?fieldsToFormat[needToFormat](cCurr): cCurr };
        }, {
          id:newUserId,
          joined_at:formatDate(),
          user_id:newUserId,
          club_id:newClientsClubId
        }),
      ]},
      []
    );

    //Making each information of client to be ready to be inserted to the relevant table.
    const customersInfoFields = ["id","joined_at","first_name","last_name","phone","email","club_id"]
    const customersInfoAll =getValuesOfObjByArrOfProperties(exel,customersInfoFields)
    const membershipInfoFields = ["user_id","start_date","end_date","membership_name"]
    const membershipInfoAll =getValuesOfObjByArrOfProperties(exel,membershipInfoFields)
    
    //Script that check if we have the same email twice in the new file.
    const emails = customersInfoAll.map(({email})=>email)
    const isEmailsAreDuplicated = hasDuplicates(emails);
    if (isEmailsAreDuplicated)
      throw new Error(
        "Oops it seems that we have duplicate emails in the file, contact the client"
      );

    console.log("<----------------------------------------------------->");

    //Query for checking if we have one of the mails from the file in our DB.
    const isFoundInDatabase = connection.query(
      "SELECT COUNT(*) from ar_db.Users where email IN (" +
        connection.escape(emails) +
        ")",
      (err_user, result_user) => {
        //If we have connection to DB we can really use the count and not insert by its result
        // const numberOfFoundExistEmails = result_user[0]['COUNT(*)']
        // console.log(`${numberOfFoundExistEmails} emails are found already in our DB`)
      }
    );
    console.log(isFoundInDatabase.sql);

    console.log("<----------------------------------------------------->");
    const joinedCustomersInfoFields =customersInfoFields.join(", ")
    const joinedMembershipInfoFields =membershipInfoFields.join(", ")
    // this is the queries =>
    let queryForClients = `INSERT INTO ar_db.Users (${joinedCustomersInfoFields}) VALUES ?`;
    const clientsRes = connection.query(
      queryForClients,
      [customersInfoAll.map(e=>Object.values(e))],
      (error, response) => {
        //   console.log(error || response);
      }
    );
    console.log(clientsRes.sql);

    console.log("<----------------------------------------------------->");

    let queryForMemberships = `INSERT INTO ar_db.Memberships (${joinedMembershipInfoFields}) VALUES ?`;
    const membershipsRes = connection.query(
      queryForMemberships,
      [membershipInfoAll.map(e=>Object.values(e))],
      (error, response) => {
        // console.log(error || response);
      }
    );
    console.log(membershipsRes.sql);
    console.log("<----------------------------------------------------->");
  });
} catch ({message}) {
  console.log(message);
}