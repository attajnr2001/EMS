/******** clear selection for voting */

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

/********* show whether election is going on  */
let showOngoingCircle = document.querySelector(".electionOngoing");
let startDate = new Date(document.querySelector(".startDate").textContent);
let endDate = new Date(document.querySelector(".endDate").textContent);

const getDateTime = async () => {
  const response = await fetch("http://worldtimeapi.org/api/timezone/Etc/UTC");
  const data = await response.json();
  return new Date(data.utc_datetime);
};

const compareDates = async () => {
  const currentDateTime = await getDateTime();

  if (currentDateTime >= startDate && currentDateTime <= endDate) {
    showOngoingCircle.style.background = "green";
  } else if (currentDateTime < endDate) {
    showOngoingCircle.style.background = "red";
    console.log("Bad");
  }
};
compareDates();

/******* show / close nav bar*/
let closeBtn = document.querySelector(".bi-x-square-fill");
let openBtn = document.querySelector(".bi-list");
let menu = document.querySelector(".menuList");

closeBtn.addEventListener("click", () => {
  menu.style.right = "-100%";
});

openBtn.addEventListener("click", () => {
  menu.style.right = "0%";
});

/***** show set date */
const showDateBtn = document.querySelector(".showDate");
const set = document.querySelector(".set");

showDateBtn.addEventListener("click", () => {
  set.style.display = "block";
});

function showVotersForm() {
  const addVotersForm = document.querySelector(".addVotersForm");
  addVotersForm.style.display = "block";
}

function showSetDate() {
  const showDate = document.querySelector(".set");
  showDate.style.display = "block";
}

let notVoted = document.querySelector(".notVoted").textContent;
let voted = document.querySelector(".voted").textContent;
const ctx = document.getElementById("myChart");
new Chart(ctx, {
  type: "pie",
  data: {
    labels: [`${notVoted} Not Voted`, `${voted} Voted`],

    datasets: [
      {
        label: "# of Votes",
        data: [notVoted, voted],
        borderWidth: 1,
      },
    ],
  },
  options: {
    plugins: {},
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
});
