function clearPresidentSelection() {
  var radios = document.getElementsByName("presidentOption");
  for (var i = 0; i < radios.length; i++) {
    radios[i].checked = false;
  }
}
function clearSecretarySelection() {
  var radios = document.getElementsByName("secretaryOption");
  for (var i = 0; i < radios.length; i++) {
    radios[i].checked = false;
  }
}

let showOngoingCircle = document.querySelector(".electionOngoing");
let startDate = new Date(document.querySelector(".startDate").textContent);
let endDate = new Date(document.querySelector(".endDate").textContent);

const getDateTime = async () => {
   const response = await fetch('http://worldtimeapi.org/api/timezone/Etc/UTC');
   const data = await response.json();
   return new Date(data.utc_datetime);
 };

 const compareDates = async () => {
   const currentDateTime = await getDateTime();
 
   if (currentDateTime >= startDate && currentDateTime <= endDate) {
      showOngoingCircle.style.background = "green";
   } else if (currentDateTime < endDate) {
      showOngoingCircle.style.background = "red";
     console.log('Bad');
   } 
 };
 
 compareDates();
 
 
 
 