// DEMO DATA: 60 made-up residents, Block B, 3rd floor, rooms 301-330 (2 per room).
// These are not real students.
const RESIDENTS = (function () {
  const names = [
    "Aarav", "Vivaan", "Aditya", "Arjun", "Rohan", "Karthik", "Siddharth", "Rahul", "Nikhil", "Varun",
    "Pranav", "Harsh", "Kunal", "Manish", "Ishan", "Dhruv", "Tejas", "Rishabh", "Sanjay", "Akshay",
    "Vikram", "Ankit", "Naveen", "Suraj", "Yash", "Mohit", "Gautam", "Sumanth", "Chirag", "Deepak",
    "Shreyas", "Kiran", "Lokesh", "Mahesh", "Nitin", "Omkar", "Prashanth", "Rakesh", "Sachin", "Tarun",
    "Uday", "Vinay", "Abhishek", "Bharath", "Chetan", "Darshan", "Eshwar", "Faisal", "Girish", "Hemanth",
    "Imran", "Jayanth", "Kishore", "Madhav", "Neeraj", "Pavan", "Raghav", "Sameer", "Tushar", "Venkat"
  ];
  return names.map(function (name, i) {
    const room = String(301 + Math.floor(i / 2));
    const bed = i % 2 === 0 ? "A" : "B";
    return { id: "B3-" + room + "-" + bed, name: name, room: room };
  });
})();
