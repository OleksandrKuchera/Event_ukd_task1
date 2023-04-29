const EventEmitter = require('events');
const fs = require('fs');
const readline = require('readline');
const { json } = require('stream/consumers');
const Mailjet = require('node-mailjet')
const mailjet = new Mailjet({
  apiKey: "256b3c0088a02195c9425017d09468d9",
  apiSecret: "73227a11043a0189595552a4ea0459b5"
});

class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

async function parser(){
  const rl = readline.createInterface({
    input: fs.createReadStream('./tempterature.json')
  });
  let data = []
  for await (const line of rl) {
    try{
      const pars = JSON.parse(line)
      data.push(pars)
    }catch(err){
      console.log(err)
    }
  }
  return data
}

myEmitter.on('addTemperature', async(date,temperatureMin,temperatureMax) => {
  const data = await parser()
  const filterDate = data.filter(d => d.date == date);
  const dateInData = filterDate.map(d => d.date);

  if(date == dateInData){
    console.log(`День : ${date}, вже записаний `)
  }else{
    const dataWrite = {'date':date, 'temperatureMin': temperatureMin,'temperatureMax': temperatureMax}

  fs.appendFile('./tempterature.json',`${JSON.stringify(dataWrite)}\n`,'utf-8',()=>{
    console.log(`День : ${date}, записано успішно`)

  if(temperatureMin >= 30 || temperatureMax >= 30){
    myEmitter.emit('highTemperature', (temperatureMin,temperatureMax))
  }
  })
}
});

myEmitter.on('averageTemperature', async(date) => {
  const data = await parser()
  const filterDate = data.filter(d => d.date === date);
  const temperaturesMin = filterDate.map(d => d.temperatureMin);
  const temperaturesMax = filterDate.map(d => d.temperatureMax);
  const allTemperatures = temperaturesMin.concat(temperaturesMax);
  let sumTemperatures = 0 
  if (allTemperatures.length > 0) {
  sumTemperatures = allTemperatures.reduce((a, b) => a + b, 0) / allTemperatures.length;
    console.log(`Середня температура повітря на ${date}: ${sumTemperatures}`);
  } else {
    console.log(`Немає даних про температуру на ${date}`);
  }
const result = sumTemperatures
  const request = mailjet
  .post("send", {'version': 'v3.1'})
  .request({
    "Messages":[
      {
        "From": {
          "Email": "leato44eek@gmail.com",
          "Name": "Sasha Kuchera"
        },
        "To": [
          {
            "Email": "lejane4878@meidecn.com",
            "Name": "Rfff PDPP"
          }
        ],
        "Subject": `Середня температура повітря на  ${date}`,
        "TextPart": `Середня температура повітря на ${date}: ${result}`,
        "HTMLPart": `<h3>Середня температура повітря на ${date}: ${result}</h3>`
      }
    ]
  })
request
  .then(result => {
    console.log(result.body)
  })
  .catch(err => {
    console.log(err.statusCode)
  })
})

myEmitter.on('highTemperature', (temperatureMin,temperatureMax) => {
  console.log('Температура повітря дорівню 30 градусів, жарко..')
})


myEmitter.emit('addTemperature','05-05-2005', 10, 19);
myEmitter.emit('addTemperature','15-05-2005', 18, 30);

myEmitter.emit('averageTemperature','03-05-2005');
myEmitter.emit('averageTemperature','07-05-2005');

