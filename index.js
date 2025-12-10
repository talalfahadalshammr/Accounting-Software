import express from "express";
import path from "path";
import bodyParser from "body-parser";
import xlsx from "xlsx";
import fs from "fs";

const app = express();
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let dataPurchases = [];
let dataTotal_inventory = [];
let dataInventory = [];
let dataSales = [];
let dataHome = {
  cash: 0,
  totalDevicesPaidAmountNumber: 0,
  totalDevicesPaid: 0,
  totalDevicesSale: 0,
  totalBenefit: 0,
  totalDevicesSellAmountNumber: 0,
  totalBenefitPearson: 0,
  totalDevicesPaidAmountNumberInventory:0,
  totalDevicesPaidInventory:0
};

app.post("/purchases", (req, res) => {
  let num = numberRandomFuci();
  if (!dataPurchases.some((item) => item.deviceID === num)) {
    dataPurchases.push({
      deviceID: num,
      dateOfPaid: `${new Date().getDate()}/${
        new Date().getMonth() + 1
      }/${new Date().getFullYear()}`,
      timeOfPaid: `${new Date().getHours()}:${new Date().getMinutes()}`,
      deviceAmount: req.body.devicePrice,
      deviceName: req.body.deviceName,
    });
    dataHome.totalDevicesPaid++;
    dataHome.totalDevicesPaidInventory++;
    dataHome.cash -= Number(req.body.devicePrice);
    dataHome.totalDevicesPaidAmountNumber += Number(req.body.devicePrice);
    dataHome.totalDevicesPaidAmountNumberInventory += Number(req.body.devicePrice);
    dataInventory.push({
      deviceID: num,
      dateOfPaid: `${new Date().getDate()}/${
        new Date().getMonth() + 1
      }/${new Date().getFullYear()}`,
      timeOfPaid: `${new Date().getHours()}:${new Date().getMinutes()}`,
      deviceAmount: req.body.devicePrice,
      deviceName: req.body.deviceName,
    });
  }
  saveExcel();
  res.redirect("purchases");
});
app.post("/edit", (req, res) => {
  const {
    deviceID,
    deviceName,
    devicePrice,
    sellerPhone,
    sellerID,
    sellerName,
  } = req.body;

  // Find the purchase in dataPurchases
  let check = dataPurchases.find((item) => item.deviceID === deviceID);
  dataHome.cash += Number(check.deviceAmount);
  dataHome.totalDevicesPaidAmountNumber  = Number(Number(check.deviceAmount) - Number(check.deviceAmount));
dataHome.totalDevicesPaidAmountNumberInventory = Number( Number(check.deviceAmount) - Number(check.deviceAmount)
  );

  if (check) {
    // Subtract old price from cash before updating
    check.deviceAmount = req.body.devicePriceEdit;
    dataHome.cash -= Number(req.body.devicePriceEdit);
    check.deviceName = req.body.deviceNameEdit;
  }

  let checkInventory = dataInventory.find((item) => item.deviceID === deviceID);
  if (checkInventory) {
    checkInventory.deviceAmount = req.body.devicePriceEdit;
    checkInventory.deviceName = req.body.deviceNameEdit;
  }

  dataHome.totalDevicesPaidAmountNumber =
    Number(dataHome.totalDevicesPaidAmountNumber) +
    Number(req.body.devicePriceEdit);
  dataHome.totalDevicesPaidAmountNumberInventory =
    Number(dataHome.totalDevicesPaidAmountNumberInventory) +
    Number(req.body.devicePriceEdit);
  saveExcel();
  res.redirect("purchases");
});
app.post("/del", (req, res) => {
  loadExcel();

  dataHome.cash += Number(req.body.devicePriceDeleleet);
  dataHome.totalDevicesPaidAmountNumber -= Number(req.body.devicePriceDeleleet);
  dataHome.totalDevicesPaidAmountNumberInventory -= Number(req.body.devicePriceDeleleet);
  dataHome.totalDevicesPaid--;
  dataHome.totalDevicesPaidInventory--;
  dataPurchases = dataPurchases.filter(
    (item) => item.deviceID !== req.body.deviceIDDel
  );
  dataInventory = dataInventory.filter(
    (item) => item.deviceID !== req.body.deviceIDDel
  );

  res.redirect("purchases");
  saveExcel();
});

app.get("/", (req, res) => {
  res.render("home.ejs", {
    totalDevicesPaid: dataHome.totalDevicesPaid,
    cash: dataHome.cash,
    totalDevicesPaidAmount: dataHome.totalDevicesPaidAmountNumber,
        totalDevicesSale: dataHome.totalDevicesSale,
    totalDevicesSellAmountNumber: dataHome.totalDevicesSellAmountNumber,
    totalBenefit:dataHome.totalBenefit,
     totalBenefitPearson:`${dataHome.totalBenefitPearson.toFixed(2)} %`,
    totalDevicesPaidInventory:dataHome.totalDevicesPaidInventory,
    totalDevicesPaidAmountNumberInventory:dataHome.totalDevicesPaidAmountNumberInventory,
  });
});
//  console.log(typeof(totalDevicesPaidAmountNumber))
app.get("/purchases", (req, res) => {
  res.render("purchases.ejs", {
    dataPurchases: dataPurchases,
    totalDevicesPaid: dataHome.totalDevicesPaid,
    cash: dataHome.cash,
    totalDevicesPaidAmount: dataHome.totalDevicesPaidAmountNumber,
  });
});
app.post("/sales", (req, res) => {
  dataSales.push({
    deviceID: req.body.deviceIDSale,
    deviceName: req.body.deviceName,
    dateOfPaid: req.body.dateOfPaid,
    timeOfPaid: req.body.timeOfPaid,
    deviceAmount: req.body.deviceAmount,
    deviceAmountSell: req.body.deviceAmountSell,
    deviceBenefit: Number(
      Number(req.body.deviceAmountSell) - Number(req.body.deviceAmount)
    ),
    dateOfSell: `${new Date().getDate()}/${
      new Date().getMonth() + 1
    }/${new Date().getFullYear()}`,
    timeOfSell: `${new Date().getHours()}:${new Date().getMinutes()}`,
  });
  dataHome.cash += Number(req.body.deviceAmountSell);
  dataHome.totalDevicesSale++;
  dataHome.totalDevicesSellAmountNumber += Number(req.body.deviceAmountSell);
  dataHome.totalDevicesPaidAmountNumberInventory -= Number(req.body.deviceAmount);
  dataHome.totalDevicesPaidInventory--
  let totalBenefit = 0
  let totalBenefitPearson = 0
  let totalDevicesAmount = 0
  for(let i = 0 ;i<dataSales.length;i++){ 
    totalBenefit+= Number(dataSales[i].deviceBenefit)
    totalDevicesAmount += Number(dataSales[i].deviceAmount)
    totalBenefitPearson =Number(totalBenefit / totalDevicesAmount) * 100

  }
 
  dataHome.totalBenefit = totalBenefit
  dataHome.totalBenefitPearson = totalBenefitPearson
  console.log(dataHome.totalBenefitPearson.toFixed(2)+"%")
  dataInventory = dataInventory.filter(
    (itme) => itme.deviceID !== req.body.deviceIDSale
  );
  res.redirect("/sales"); // correct path
  saveExcel();
});
app.post("/delSell", (req, res) => {
  const deviceIDDelSell = Number(req.body.deviceIDDelSell);
  let deviceIDDelSellCheck = dataSales.find(
    (itme) => Number(itme.deviceID) === deviceIDDelSell
  );
  console.log(deviceIDDelSellCheck);
  if (deviceIDDelSellCheck) {
    dataInventory.push({
      deviceID: deviceIDDelSellCheck.deviceID,
      dateOfPaid: deviceIDDelSellCheck.dateOfPaid,
      timeOfPaid: deviceIDDelSellCheck.timeOfPaid,
      deviceAmount: deviceIDDelSellCheck.deviceAmount,
      deviceName:deviceIDDelSellCheck.deviceName,
    });
  }
  dataSales = dataSales.filter(
    (itme) => Number(itme.deviceID) !== deviceIDDelSell
  );
     dataHome.cash -= Number(deviceIDDelSellCheck.deviceAmountSell);
  dataHome.totalDevicesSale--;
  dataHome.totalDevicesSellAmountNumber -= Number(deviceIDDelSellCheck.deviceAmountSell);
 deviceIDDelSellCheck.deviceBenefit = 0
  dataHome.totalDevicesPaidAmountNumberInventory += Number(deviceIDDelSellCheck.deviceAmount);
  dataHome.totalDevicesPaidInventory++
  let totalBenefit = 0
  let totalBenefitPearson = 0
  let totalDevicesAmount = 0
  for(let i = 0 ;i<dataSales.length;i++){ 
    totalBenefit+= Number(dataSales[i].deviceBenefit)
    totalDevicesAmount += Number(dataSales[i].deviceAmount)
    totalBenefitPearson =Number(totalBenefit / totalDevicesAmount) * 100

  }
 
  dataHome.totalBenefit = totalBenefit
  dataHome.totalBenefitPearson = totalBenefitPearson
  console.log(dataHome.totalBenefitPearson.toFixed(2)+"%")
   saveExcel();
  res.redirect("/sales");
 
});
app.post("/salesEdit", (req, res) => {
  let deviceIDEditSell = Number(req.body.deviceIDSaleEdit);
  let deviceIDEditSellCheck = dataSales.find(
    (item) => Number(item.deviceID) === deviceIDEditSell
  );
   dataHome.cash -= Number(deviceIDEditSellCheck.deviceAmountSell);
  dataHome.totalDevicesSale--;
  dataHome.totalDevicesSellAmountNumber -= Number(deviceIDEditSellCheck.deviceAmountSell);
 deviceIDEditSellCheck.deviceBenefit = 0
  if (deviceIDEditSellCheck) {
    deviceIDEditSellCheck.deviceID = req.body.deviceIDSaleEdit;
    deviceIDEditSellCheck.deviceName = req.body.deviceName;
    deviceIDEditSellCheck.deviceAmount = Number(req.body.deviceAmountEdit);
    deviceIDEditSellCheck.deviceAmountSell = Number(
      req.body.deviceAmountSellEdit
    );
    dataHome.cash += Number(req.body.deviceAmountSellEdit);
  dataHome.totalDevicesSale++;
  dataHome.totalDevicesSellAmountNumber += Number(req.body.deviceAmountSellEdit);
   deviceIDEditSellCheck.deviceBenefit = Number(req.body.deviceAmountSellEdit) - Number(req.body.deviceAmountEdit)
  let totalBenefit = 0
  let totalBenefitPearson = 0
  let totalDevicesAmount = 0
  for(let i = 0 ;i<dataSales.length;i++){ 
    totalBenefit+= Number(dataSales[i].deviceBenefit)
    totalDevicesAmount += Number(dataSales[i].deviceAmount)
    totalBenefitPearson =Number(totalBenefit / totalDevicesAmount) * 100

  }
 
  dataHome.totalBenefit = totalBenefit
  dataHome.totalBenefitPearson = totalBenefitPearson
  console.log(dataHome.totalBenefitPearson.toFixed(2)+"%")
  }
  res.redirect("/sales");
  saveExcel();
});
app.get("/sales", (req, res) => {
  // remove message
  res.render("sales.ejs", {
    dataInventory: dataInventory,
    dataSales: dataSales,
    cash: dataHome.cash,
    totalDevicesSale: dataHome.totalDevicesSale,
    totalDevicesSellAmountNumber: dataHome.totalDevicesSellAmountNumber,
    totalBenefit:dataHome.totalBenefit,
    totalBenefitPearson:`${dataHome.totalBenefitPearson.toFixed(2)} %`
  });
});

app.get("/inventory", (req, res) => {
  res.render("inventory.ejs", { 
    dataInventory: dataInventory ,
    totalDevicesPaidInventory:dataHome.totalDevicesPaidInventory,
    totalDevicesPaidAmountNumberInventory:dataHome.totalDevicesPaidAmountNumberInventory
  });
});

function saveExcel() {
  let cash = dataHome.cash;
  let totalDevicesPaidAmountNumber = dataHome.totalDevicesPaidAmountNumber;
  let totalDevicesPaid = dataHome.totalDevicesPaid;
  let totalBenefit = dataHome.totalBenefit;
  let totalDevicesSellAmountNumber = dataHome.totalDevicesSellAmountNumber;
  let totalDevicesSale = dataHome.totalDevicesSale;
  let totalBenefitPearson = dataHome.totalBenefitPearson;
  let totalDevicesPaidAmountNumberInventory = dataHome.totalDevicesPaidAmountNumberInventory;
  let totalDevicesPaidInventory = dataHome.totalDevicesPaidInventory;
  const worksheetDataPurchases = xlsx.utils.json_to_sheet(dataPurchases);
  const worksheetDataInventory = xlsx.utils.json_to_sheet(dataInventory);
  const worksheetDataSales = xlsx.utils.json_to_sheet(dataSales);
  const worksheetDataHome = xlsx.utils.json_to_sheet([dataHome]);
  const workbookwrite = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(
    workbookwrite,
    worksheetDataPurchases,
    "dataPurchases"
  );
  xlsx.utils.book_append_sheet(
    workbookwrite,
    worksheetDataInventory,
    "dataInventory"
  );
  xlsx.utils.book_append_sheet(workbookwrite, worksheetDataSales, "dataSales");

  worksheetDataHome["A2"] = { t: "n", v: cash };
  worksheetDataHome["B2"] = { t: "n", v: totalDevicesPaidAmountNumber };
  worksheetDataHome["C2"] = { t: "n", v: totalDevicesPaid };
  worksheetDataHome["D2"] = { t: "n", v: totalDevicesSale };
  worksheetDataHome["E2"] = { t: "n", v: totalBenefit };
  worksheetDataHome["F2"] = { t: "n", v: totalDevicesSellAmountNumber };
  worksheetDataHome["G2"] = { t: "n", v: totalBenefitPearson };
  worksheetDataHome["H2"] = { t: "n", v: totalDevicesPaidInventory };
  worksheetDataHome["I2"] = { t: "n", v: totalDevicesPaidAmountNumberInventory };
  xlsx.utils.book_append_sheet(workbookwrite, worksheetDataHome, "dataHome");
  xlsx.writeFile(workbookwrite, "data.xlsx");
}

app.post("/salesEdit", (req, res) => {
  let deviceIDEditSell = Number(req.body.deviceIDSaleEdit);
  let deviceIDEditSellCheck = dataSales.find(
    (item) => Number(item.deviceIDSale) === deviceIDEditSell
  );
  if (deviceIDEditSellCheck) {
    deviceIDEditSellCheck.deviceIDSale = deviceIDEditSell;
    deviceIDEditSellCheck.deviceName = req.body.deviceName;
    deviceIDEditSellCheck.deviceAmount = Number(req.body.deviceAmountEdit);
    deviceIDEditSellCheck.deviceAmountSell = Number(
      req.body.deviceAmountSellEdit
    );
    deviceIDEditSellCheck.deviceBinft = Number(req.body.deviceBinftEdit);
    deviceIDEditSellCheck.deviceBinft =
      Number(req.body.deviceAmountSellEdit) - Number(req.body.deviceAmountEdit);
    console.log(deviceIDEditSellCheck.deviceAmountSell);
  }
  res.redirect("/sales");
});

function loadExcel() {
  if (!fs.existsSync("data.xlsx")) return;

  const workbook = xlsx.readFile("data.xlsx");
  const sheet1 = workbook.Sheets["dataPurchases"];
  const sheet2 = workbook.Sheets["dataHome"];
  const sheet3 = workbook.Sheets["dataInventory"];
  const sheet4 = workbook.Sheets["dataSales"];
  dataPurchases = xlsx.utils.sheet_to_json(sheet1);
  dataInventory = xlsx.utils.sheet_to_json(sheet3);
  dataSales = xlsx.utils.sheet_to_json(sheet4);
  dataHome.cash = sheet2["A2"] ? sheet2["A2"].v : null;
  dataHome.totalDevicesPaidAmountNumber = sheet2["B2"] ? sheet2["B2"].v : null;
  dataHome.totalDevicesPaid = sheet2["C2"] ? sheet2["C2"].v : null;
  dataHome.totalDevicesSale = sheet2["D2"] ? sheet2["D2"].v : null;
  dataHome.totalBenefit = sheet2["E2"] ? sheet2["E2"].v : null;
  dataHome.totalDevicesSellAmountNumber = sheet2["F2"] ? sheet2["F2"].v : null;
  dataHome.totalBenefitPearson = sheet2["G2"] ? sheet2["G2"].v : null;
  dataHome.totalDevicesPaidInventory = sheet2["H2"] ? sheet2["H2"].v : null;
  dataHome.totalDevicesPaidAmountNumberInventory = sheet2["I2"] ? sheet2["I2"].v : null;
}

loadExcel();
function numberRandomFuci() {
  let numberRandom = Math.floor(Math.random() * 4 ** 4)
    .toString(4)
    .padStart(4, "0");
  return numberRandom;
}

console.log(dataHome);

app.listen(1414, () => {
  console.log("The Server Is Running 1414");
});
