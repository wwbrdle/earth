import React, { useState } from 'react';
import './App.css';
import QuestionCard from './components/QuestionCard';
import SpeechRecognition from './components/SpeechRecognition';
import ResultDisplay from './components/ResultDisplay';
import LandingPage from './components/LandingPage';
import TEFWriting from './components/TEFWriting';
import TEFSpeaking from './components/TEFSpeaking';
import { analyzeWithGemini } from './utils/geminiApi';

interface Question {
  id: number;
  question: string;
  sampleAnswer: string;
  category: string;
}

interface Part2Question {
  id: number;
  topic: string;
  mainQuestion: string;
  subQuestions: string[];
  sampleAnswer: string;
  category: string;
  part3Questions: Part3Question[];
}

interface Part3Question {
  id: number;
  question: string;
  sampleAnswer: string;
}

const sampleQuestions: Question[] = [
  // Your Country
  {
    id: 1,
    question: "Which part of your country do most people live in?",
    sampleAnswer: "Well, I think most people in my country live in and around Seoul. As you might expect, Seoul is the busiest city in Korea and a lot of people live there. But I think more people live on the outskirts of Seoul and commute in because the rent is cheaper and the air quality is a bit better than in the city.",
    category: "Part 1 - Your Country"
  },
  {
    id: 2,
    question: "Tell me about the main industries there.",
    sampleAnswer: "Well, I think the main industries in Seoul are technology and electronics. The city is home to major companies like Samsung, LG, and Hyundai, which create thousands of jobs. Apart from that, hospitality is also a big industry, with coffee shops and bars on almost every corner.",
    category: "Part 1 - Your Country"
  },
  {
    id: 3,
    question: "How easy is it to travel around your country?",
    sampleAnswer: "Actually, I think it's quite easy to travel around Korea. Trains and buses are frequent and affordable, which makes public transport really convenient. There's also a high-speed train that connects major cities, although it's a bit more expensive. On top of that, the roads are excellent, so driving is also a great option if you want more flexibility.",
    category: "Part 1 - Your Country"
  },
  {
    id: 4,
    question: "Has your country changed much since you were a child?",
    sampleAnswer: "Yes, I think it has changed massively since I was a child. It has become much more modern and internationally aware. These days, you can easily find food from all over the world and see lots of foreigners living and working in Korea. Technology has also developed rapidly—maybe even too much sometimes!",
    category: "Part 1 - Your Country"
  },
  
  // Your Home
  {
    id: 5,
    question: "Do you live in a house or a flat?",
    sampleAnswer: "I live in a basement flat, and it's a cozy space with everything I need. It has a washing machine, a dryer, and good ventilation, which makes it really comfortable to live in.",
    category: "Part 1 - Your Home"
  },
  {
    id: 6,
    question: "What are the differences between the place you live now and where you lived before?",
    sampleAnswer: "Well, I think the biggest difference is privacy. Before, I lived in a shared house and rented a single room, which meant I had to share the kitchen and bathroom with others. That wasn't always convenient. Now, I have my own space, which is larger and much more comfortable, and I really enjoy that.",
    category: "Part 1 - Your Home"
  },
  {
    id: 7,
    question: "Did you like the place you lived in as a child?",
    sampleAnswer: "Yes, I really liked it because I grew up on the 12th floor of a condo, and many of my friends lived in the same complex. We used to play soccer, baseball, and video games together almost every day, which made my childhood really fun and memorable.",
    category: "Part 1 - Your Home"
  },
  {
    id: 8,
    question: "Which part of your home do you like best?",
    sampleAnswer: "I'd say my favorite part is the living area because it feels spacious and comfortable. I also love the fact that I have a washing machine and dryer, which is super convenient. Plus, the ventilation system keeps the place fresh, especially after cooking.",
    category: "Part 1 - Your Home"
  },
  {
    id: 9,
    question: "In the future, what type of home would you like to live in?",
    sampleAnswer: "In the future, I'd love to live in a spacious condo because it's clean and low-maintenance. You don't have to worry about things like gardening, and most condos have great security, which would make me feel safe and comfortable.",
    category: "Part 1 - Your Home"
  },
  
  // Weekends
  {
    id: 10,
    question: "How do you usually spend your weekends?",
    sampleAnswer: "Well, these days I usually spend my weekends exploring Montreal because I've only been here for a few months. I especially enjoy visiting cozy coffee shops with a nice atmosphere. For example, I love sitting in a café, organizing my upcoming schedule, or working on side projects because it helps me stay focused and productive.",
    category: "Part 1 - Weekends"
  },
  {
    id: 11,
    question: "Which is your favourite part of the weekend?",
    sampleAnswer: "I'd say my favorite part is Saturday morning because it feels like the start of a relaxing and enjoyable weekend. I know I still have plenty of time ahead to do fun things and also relax on Sunday before going back to work.",
    category: "Part 1 - Weekends"
  },
  {
    id: 12,
    question: "Do you think your weekends are long enough?",
    sampleAnswer: "Actually, I think weekends are long enough, but they always feel short. Sometimes when I get a long weekend, I feel it can even be a bit too long. Of course, it's nice to have Monday off once in a while, but in general, two days are enough for me to rest and recharge.",
    category: "Part 1 - Weekends"
  },
  {
    id: 13,
    question: "How important do you think it is to have free time at the weekend?",
    sampleAnswer: "That's an interesting question. I think it's absolutely essential because without free time on weekends, people can't really recharge or relax. To stay productive during the week, we need to feel well-rested, so having time to unwind is vital for both our work performance and our overall well-being.",
    category: "Part 1 - Weekends"
  },
  
  // Transportation
  {
    id: 14,
    question: "How often do you use public transport?",
    sampleAnswer: "I usually take the bus every day because I need it to commute to and from work. It normally takes around an hour and a half, so I spend quite a bit of time on public transport.",
    category: "Part 1 - Transportation"
  },
  {
    id: 15,
    question: "When was the last time you travelled by public transport?",
    sampleAnswer: "Actually, it was this morning because I take the bus every day to go to work. It's often crowded, so I can't say I enjoy it, but it's still the most practical option for me.",
    category: "Part 1 - Transportation"
  },
  {
    id: 16,
    question: "Do you prefer to use a private car or public transport?",
    sampleAnswer: "Well, it depends on the situation, but generally I prefer public transport because it's punctual and much cheaper than owning a car. However, for long-distance travel, using a private car can be more convenient.",
    category: "Part 1 - Transportation"
  },
  {
    id: 17,
    question: "What form of transport would you recommend visitors to your hometown use?",
    sampleAnswer: "I'd definitely recommend visitors to use the Metro because it's fast, punctual, and very convenient for getting around. In Montreal, the Metro connects key areas like downtown and Old Montreal efficiently. It's also a great way to avoid traffic and explore the city comfortably.",
    category: "Part 1 - Transportation"
  },
  {
    id: 18,
    question: "Do you think people will drive more in the future?",
    sampleAnswer: "That's an interesting question. I think people will probably drive more in the future because many households are already buying more than one car for convenience. Unless public transport becomes more attractive, this trend is likely to continue.",
    category: "Part 1 - Transportation"
  },
  {
    id: 19,
    question: "Is driving to work popular in your country?",
    sampleAnswer: "Yes, it's very popular in Korea, mainly because public transport can take longer and follow fixed routes, which isn't always convenient. So a lot of people prefer the flexibility of driving to work.",
    category: "Part 1 - Transportation"
  },
  
  // Television
  {
    id: 20,
    question: "How often do you watch television?",
    sampleAnswer: "I usually watch TV almost every day, but only for about an hour. Some days I don't have time, and that's fine because I don't really need TV in my life. However, when I do watch, I enjoy it as a way to relax for a short while.",
    category: "Part 1 - Television"
  },
  {
    id: 21,
    question: "Which television channel do you usually watch?",
    sampleAnswer: "I'd say I mostly watch National Geographic because I'm really interested in programs about nature and wildlife. I love shows that study animals in the wild since that's something we rarely see in daily life, and I find it absolutely fascinating.",
    category: "Part 1 - Television"
  },
  {
    id: 22,
    question: "Do you enjoy the advertisements on television?",
    sampleAnswer: "Honestly, I definitely don't because advertisements are the most annoying part of watching TV. Just when I'm enjoying a good program, there's a five-minute break with ads. It makes me lose focus, and I often end up switching the channel.",
    category: "Part 1 - Television"
  },
  {
    id: 23,
    question: "Do you think that most programs on television are good?",
    sampleAnswer: "Actually, I don't think so because even though there are so many channels these days, I often struggle to find something interesting. A lot of shows feel repetitive, with similar jokes and ideas, which makes them quite boring for me.",
    category: "Part 1 - Television"
  },
  
  // Newspapers and Magazines
  {
    id: 24,
    question: "Which newspapers and magazines do you read?",
    sampleAnswer: "Well, these days I don't really read newspapers because I usually get news online. However, I do enjoy reading Sports Illustrated because I'm really into sports, especially baseball. It provides exciting coverage of games and players, which keeps me engaged. I particularly love reading about stats and player highlights, as they deepen my passion for the game.",
    category: "Part 1 - Newspapers"
  },
  {
    id: 25,
    question: "What kinds of article are you most interested in?",
    sampleAnswer: "I'd say I'm most interested in articles about economics and finance because I'm deeply interested in these areas, especially the stock market. I enjoy keeping up with market trends and investment strategies, and I think it's essential to understand what's happening in your country's economy.",
    category: "Part 1 - Newspapers"
  },
  {
    id: 26,
    question: "Have you ever read a magazine or newspaper in a foreign language?",
    sampleAnswer: "Yes, I have. I remember trying to read a French newspaper when I was in Montreal. The articles were interesting, but my French wasn't strong enough to fully understand everything. I struggled with some words and complex sentences, but it was still a great way to practice and learn more about the local culture.",
    category: "Part 1 - Newspapers"
  },
  {
    id: 27,
    question: "Do you think reading a newspaper or magazine in a foreign language is a good way to learn the language?",
    sampleAnswer: "Absolutely, because reading newspapers in a foreign language helps you learn vocabulary in context. When I tried reading a French newspaper in Montreal, it was challenging, but I picked up new words naturally. It's an engaging way to improve both language skills and cultural knowledge.",
    category: "Part 1 - Newspapers"
  },
  
  // Music
  {
    id: 28,
    question: "What kinds of music do you like?",
    sampleAnswer: "I'd say I usually enjoy band music and K-pop because they're energetic and uplifting. Listening to them really motivates me, especially when I need a boost of energy during the day.",
    category: "Part 1 - Music"
  },
  {
    id: 29,
    question: "When was the last time you went to a musical performance?",
    sampleAnswer: "I remember the last time was in April, when I went to a Coldplay concert in Korea with one of my friends. It was an amazing experience—the live atmosphere and energy from the crowd were absolutely unforgettable.",
    category: "Part 1 - Music"
  },
  {
    id: 30,
    question: "Do you feel that going to a concert is better than listening to a CD, or watching a concert on TV?",
    sampleAnswer: "Yes, I definitely think going to a concert is far better because the energy and interaction you experience there can't be matched by recordings or TV broadcasts. The excitement of the crowd and the live music create an unforgettable atmosphere.",
    category: "Part 1 - Music"
  },
  {
    id: 31,
    question: "Have you ever been in a choir or some other musical performance?",
    sampleAnswer: "Yes, I have. I remember when I was in elementary school, I learned to play the flute and joined a small music club. We even performed together at the school festival, which was a really fun experience.",
    category: "Part 1 - Music"
  },
  {
    id: 32,
    question: "Do students in your country have to study the creative arts, such as music?",
    sampleAnswer: "Yes, they do. In Korea, music is a required subject in elementary school, along with other creative arts like painting and sometimes dance. It's part of the national curriculum to give students a balanced education.",
    category: "Part 1 - Music"
  },
  
  // Musical Instrument
  {
    id: 41,
    question: "Which instrument do you like listening to most? and why?",
    sampleAnswer: "I'd say I enjoy listening to the guitar the most because I love band music. The sound of the guitar is so versatile, and it adds a lot of energy to songs. I even tried to learn it when I was a university student, but I gave up because it was quite challenging.",
    category: "Part 1 - Musical Instrument"
  },
  {
    id: 42,
    question: "Have you ever learned to play a musical instrument?",
    sampleAnswer: "Yes, I have. I remember learning to play the flute when I was in elementary school. It was my first real experience with music, and I really enjoyed performing with my classmates during school events.",
    category: "Part 1 - Musical Instrument"
  },
  {
    id: 43,
    question: "Do you think children should learn to play a musical instrument at school?",
    sampleAnswer: "Yes, I believe children should learn a musical instrument at school because it helps them develop creativity and discipline. For example, one of my friends learned the guitar in elementary school, and now he's a guitarist in a band.",
    category: "Part 1 - Musical Instrument"
  },
  {
    id: 44,
    question: "How easy would it be to learn a musical instrument without a teacher?",
    sampleAnswer: "I think it's possible these days because there are so many online resources like video tutorials and apps. Students can practice at home using platforms such as YouTube, so it's much easier than before, even without a personal teacher.",
    category: "Part 1 - Musical Instrument"
  },
  
  // Food
  {
    id: 45,
    question: "What sort of food do you like eating most?",
    sampleAnswer: "I'd say I prefer getting take-out food from restaurants because I don't really enjoy cooking. Since I live alone, I often end up wasting ingredients when I buy them for cooking, so take-out is much more convenient for me.",
    category: "Part 1 - Food"
  },
  {
    id: 46,
    question: "Who normally does the cooking in your house?",
    sampleAnswer: "As I live alone, I usually do the cooking myself. However, I only make very simple dishes, like grilling meat or preparing quick meals, because I'm not very skilled at cooking.",
    category: "Part 1 - Food"
  },
  {
    id: 47,
    question: "Do you watch cookery programs on TV?",
    sampleAnswer: "Not really, because I'm not very interested in cooking. So I hardly ever watch cooking shows, although sometimes I come across short food videos online by accident.",
    category: "Part 1 - Food"
  },
  {
    id: 48,
    question: "In general, do you prefer eating out or eating at home? why?",
    sampleAnswer: "I usually prefer eating at home because it's more relaxing and comfortable. I enjoy having a meal while watching TV, as it helps me unwind after a long day. Plus, home-cooked food is generally healthier and more affordable than eating out.",
    category: "Part 1 - Food"
  },
  {
    id: 49,
    question: "In your country, is it expensive to eat out?",
    sampleAnswer: "It didn't use to be very expensive, but these days the prices have gone up a lot. For example, a bowl of bibimbap used to cost around seven dollars, but now it's about fifteen. So eating out regularly can be quite pricey.",
    category: "Part 1 - Food"
  },
  {
    id: 50,
    question: "Tell me about a traditional Korean dish.",
    sampleAnswer: "A typical Korean meal usually consists of rice, soup, and several side dishes, known as banchan. These side dishes often include seasoned vegetables, meat, and sometimes fish. This combination is very common in Korean households and represents the balance of flavors and nutrition in our cuisine.",
    category: "Part 1 - Food"
  },
  
  // Snacks
  {
    id: 51,
    question: "Do you like to eat snacks?",
    sampleAnswer: "I'd say I really like eating snacks, especially chocolate bars like Snickers or chips such as Cheetos, simply because they're quick, tasty, and give me a little energy boost.",
    category: "Part 1 - Snacks"
  },
  {
    id: 52,
    question: "What snacks do you usually eat?",
    sampleAnswer: "Well, I usually go for chocolate bars like Snickers or salty snacks like Cheetos. Sometimes, I mix it up with biscuits or cookies, depending on my mood.",
    category: "Part 1 - Snacks"
  },
  {
    id: 53,
    question: "Do you still eat the same types of snacks that you ate when you were a child?",
    sampleAnswer: "Yes, I do. In fact, whenever I visit Korea, I remember buying the snacks I used to eat as a kid, and it always brings back a lot of good memories.",
    category: "Part 1 - Snacks"
  },
  {
    id: 54,
    question: "What was the most popular snack when you were a child?",
    sampleAnswer: "Well, back in my childhood, I'd say Pepero was the most popular snack. It's a thin biscuit stick covered with chocolate, and almost every kid loved it.",
    category: "Part 1 - Snacks"
  },
  {
    id: 55,
    question: "Are there any snacks that you have never eaten that you would like to try?",
    sampleAnswer: "Yes, I'd love to try some Dubai chocolates, because I've heard they're really rich and unique in flavor.",
    category: "Part 1 - Snacks"
  },
  {
    id: 56,
    question: "Would you like to try foreign snack?",
    sampleAnswer: "Definitely! If I had the chance, I would really like to try some French snacks, because they're famous for their pastries and sweets.",
    category: "Part 1 - Snacks"
  },
  
  // Friends
  {
    id: 57,
    question: "How often do you go out with friends?",
    sampleAnswer: "I usually meet my friends once or twice a month. We often go to nice restaurants and enjoy delicious food together, which is a great way to relax.",
    category: "Part 1 - Friends"
  },
  {
    id: 58,
    question: "Tell me about your best friend at school.",
    sampleAnswer: "I remember meeting my best friend in high school. We had similar personalities and interests. For example, we both loved baseball and band music, so we often went to games and concerts together.",
    category: "Part 1 - Friends"
  },
  {
    id: 59,
    question: "How friendly are you with your neighbours?",
    sampleAnswer: "Honestly, I'm not very close with my neighbours. We usually just say hello, but we don't really hang out or talk much.",
    category: "Part 1 - Friends"
  },
  {
    id: 60,
    question: "Which is more important to you, friends or family?",
    sampleAnswer: "Well, in my opinion, family is definitely more important, because they've always been there for me and supported me in every situation.",
    category: "Part 1 - Friends"
  },
  
  // Festivals and Celebrations
  {
    id: 65,
    question: "How do you usually celebrate your birthday?",
    sampleAnswer: "I usually celebrate by going out for dinner with my friends. I like keeping it simple and spending quality time with people I care about.",
    category: "Part 1 - Festivals"
  },
  {
    id: 66,
    question: "How did you celebrate your last birthday?",
    sampleAnswer: "Last year, I remember celebrating my birthday with a nice dinner at a restaurant with friends. It was really enjoyable.",
    category: "Part 1 - Festivals"
  },
  {
    id: 67,
    question: "How do you think you will celebrate your next birthday?",
    sampleAnswer: "I'd like to spend my next birthday in Korea with my family. I think it would be really special because I don't get to see them very often.",
    category: "Part 1 - Festivals"
  },
  {
    id: 68,
    question: "What is the most important day of the year for you?",
    sampleAnswer: "That's an interesting question. For me, New Year's Day is the most important day, because it's a time to reconnect with my family and wish each other a happy and successful year ahead.",
    category: "Part 1 - Festivals"
  },
  
  // Wedding
  {
    id: 69,
    question: "Can you talk about some things people do at a traditional wedding?",
    sampleAnswer: "That's an interesting question. In my country, people usually have a ceremony where the couple exchanges vows and rings. After that, there's often a big meal with friends and family, and sometimes traditional performances like music or dancing.",
    category: "Part 1 - Wedding"
  },
  {
    id: 70,
    question: "How important is marriage in a person's life?",
    sampleAnswer: "Well, in my opinion, marriage is a really important decision because it means finding someone to spend your whole life with. For me, it's something that requires a lot of thought and commitment.",
    category: "Part 1 - Wedding"
  },
  {
    id: 71,
    question: "What is the difference of what people think about marriage compared to the past?",
    sampleAnswer: "That's an interesting question. I think in the past, people often saw marriage as a duty or even a social expectation. But nowadays, many people see it more as a personal choice, focusing on love and compatibility rather than just tradition.",
    category: "Part 1 - Wedding"
  },
  {
    id: 72,
    question: "What do people wear at a wedding?",
    sampleAnswer: "In my country, the bride usually wears a white wedding dress, while the groom often wears a suit or a tuxedo. In traditional Korean weddings, some couples also wear hanbok, which adds a cultural touch to the ceremony.",
    category: "Part 1 - Wedding"
  },
  
  // Family
  {
    id: 73,
    question: "Can you tell me about your family?",
    sampleAnswer: "My family has four members: my parents, my sister, and me. My parents run a small beauty salon, which they love doing. My sister works as an officer at city hall. We're very close and enjoy spending weekends together, like our recent barbecue party in the backyard.",
    category: "Part 1 - Family"
  },
  {
    id: 74,
    question: "How much time do you spend with your family?",
    sampleAnswer: "Honestly, these days I don't see my family much because they all live in Korea. But when I was there, we used to meet about once a month and have dinner together, which was really nice.",
    category: "Part 1 - Family"
  },
  {
    id: 75,
    question: "What do you like to do with your family?",
    sampleAnswer: "I'd say I really enjoy having a barbecue party with my family. It's a great chance to eat good food, talk, and simply spend quality time together.",
    category: "Part 1 - Family"
  },
  {
    id: 76,
    question: "Who are you closest to in your family?",
    sampleAnswer: "I'm definitely closest to my mom. She has always supported me and I feel comfortable sharing everything with her.",
    category: "Part 1 - Family"
  },
  
  // Flowers
  {
    id: 77,
    question: "Do you like flowers?",
    sampleAnswer: "Yes, I do. I think flowers are simple but beautiful, and they always make the atmosphere brighter.",
    category: "Part 1 - Flowers"
  },
  {
    id: 78,
    question: "What kinds of flowers do you like the most?",
    sampleAnswer: "I'd say I like roses the most, simply because they look elegant and they also symbolize love and affection.",
    category: "Part 1 - Flowers"
  },
  {
    id: 79,
    question: "When do people in your country normally give flowers to others?",
    sampleAnswer: "In Korea, people usually give flowers on special occasions like weddings, graduations, or even funerals. It's a way to celebrate or show respect.",
    category: "Part 1 - Flowers"
  },
  {
    id: 80,
    question: "When was the last time you gave flowers to someone?",
    sampleAnswer: "I remember giving flowers about three years ago when one of my relatives passed away. In Korea, it's common to send funeral wreaths to express condolences.",
    category: "Part 1 - Flowers"
  },
  {
    id: 81,
    question: "Are there any flowers that have special meaning to people in your country?",
    sampleAnswer: "Yes, in Korea, chrysanthemums often symbolize mourning, so they're used in funerals. On the other hand, roses are usually connected with love, and carnations are very meaningful on Parents' Day because they represent respect and gratitude.",
    category: "Part 1 - Flowers"
  },
  
  // Weather & Seasons
  {
    id: 86,
    question: "What's the weather like in your hometown?",
    sampleAnswer: "Well, I'm from Seoul, and the weather there is quite diverse. We have hot and humid summers, cold winters with some snow, and mild spring and autumn seasons.",
    category: "Part 1 - Weather"
  },
  {
    id: 87,
    question: "Would you prefer to live in a place with one season all year round, or four different seasons?",
    sampleAnswer: "I'd say I prefer living in a place with just one season. For example, I stayed in Miami for a few months, and I liked it because I didn't need many clothes and the weather was always predictable.",
    category: "Part 1 - Weather"
  },
  {
    id: 88,
    question: "Do you do different activities in different seasons?",
    sampleAnswer: "The activities vary a lot by season. In summer, people enjoy going to the beach, swimming, or having outdoor barbecues. In winter, skiing and snowboarding are very popular in the mountains. Spring is perfect for hiking or going on picnics under the cherry blossoms, while autumn is ideal for visiting national parks and enjoying the fall foliage. Each season offers a unique experience, which is one reason tourism is strong all year round.",
    category: "Part 1 - Weather"
  },
  {
    id: 89,
    question: "Does the weather have much impact on your life?",
    sampleAnswer: "Yes, the weather impacts my life a lot. For example, on sunny days, I feel energetic and go jogging in the park. But on rainy days, I stay home, maybe watching movies, and feel less active. Bad weather, like storms, can also cancel plans, such as picnics with friends.",
    category: "Part 1 - Weather"
  },
  {
    id: 90,
    question: "What sort of weather do you prefer?",
    sampleAnswer: "I prefer hot weather, mainly because it's perfect for swimming and I really enjoy outdoor activities in the sun.",
    category: "Part 1 - Weather"
  },
  {
    id: 91,
    question: "Would you prefer to go to a hot place, or a cold place for a holiday?",
    sampleAnswer: "I'd pick a hot place, like Miami, for a holiday because I love sunny weather for swimming at the beach. It feels relaxing and fun. Cold places, like a ski resort, are okay for skiing, but I find heavy winter clothes uncomfortable.",
    category: "Part 1 - Weather"
  },
  {
    id: 92,
    question: "How do rainy days make you feel?",
    sampleAnswer: "Honestly, rainy days make me feel less active. I usually stay indoors and don't feel very motivated to go out.",
    category: "Part 1 - Weather"
  },
  {
    id: 93,
    question: "What's your favourite season of the year?",
    sampleAnswer: "My favourite season is definitely summer, because I can go swimming and spend more time outdoors.",
    category: "Part 1 - Weather"
  },
  {
    id: 94,
    question: "What do you like to do when it's hot?",
    sampleAnswer: "When it's hot, I usually like to go swimming. It's refreshing and a fun way to cool down.",
    category: "Part 1 - Weather"
  },
  {
    id: 95,
    question: "What do you usually do in the winter?",
    sampleAnswer: "In the winter, I usually stay at home and watch Netflix. It's a cozy way to spend the cold season.",
    category: "Part 1 - Weather"
  },
  
  // Clothes & Fashion
  {
    id: 96,
    question: "How important are clothes and fashion to you?",
    sampleAnswer: "Well, I think clothes and fashion are quite important, because they show your personality and also help you feel confident in different situations.",
    category: "Part 1 - Fashion"
  },
  {
    id: 97,
    question: "What kind of clothes do you dislike?",
    sampleAnswer: "I don't really like wearing suits. Back in Korea, I had to wear one for work, and honestly, it wasn't very comfortable for me.",
    category: "Part 1 - Fashion"
  },
  {
    id: 98,
    question: "How different are the clothes you wear now from those you wore 10 years ago?",
    sampleAnswer: "About 10 years ago, I was more interested in fashion, so I tried many different styles. These days, though, I just dress casually and don't care too much about trends.",
    category: "Part 1 - Fashion"
  },
  {
    id: 99,
    question: "What do you think the clothes we wear say about us?",
    sampleAnswer: "That's a good question. I think the clothes we wear often show our personality, lifestyle, and sometimes even our social status. For example, someone wearing sportswear might be seen as active, while formal clothes can show professionalism.",
    category: "Part 1 - Fashion"
  },
  {
    id: 100,
    question: "Do you like shopping for clothes?",
    sampleAnswer: "Yes, I do. I usually enjoy going to outlets and buying clothes in bulk, because it saves both money and time.",
    category: "Part 1 - Fashion"
  },
  {
    id: 101,
    question: "Have you ever bought clothes that you don't like?",
    sampleAnswer: "Yes, I remember once buying a long coat because my girlfriend liked that style. But honestly, I didn't enjoy wearing it because it felt uncomfortable.",
    category: "Part 1 - Fashion"
  },
  
  // Social Network
  {
    id: 102,
    question: "What kind of social networking websites do you like to use?",
    sampleAnswer: "I mostly use LinkedIn, since it's a great platform for networking with people in the same industry, especially in software engineering.",
    category: "Part 1 - Social Network"
  },
  {
    id: 103,
    question: "Do you think social media will become more popular in the future?",
    sampleAnswer: "Of course. In my opinion, social media will keep growing, especially if platforms become more specialized. For example, LinkedIn targets professionals, and I think this kind of focus will attract even more users in the future.",
    category: "Part 1 - Social Network"
  },
  {
    id: 104,
    question: "Do you like to use Facebook?",
    sampleAnswer: "Yes, I do. I especially enjoy using the marketplace feature, because it's convenient for buying and selling second-hand items.",
    category: "Part 1 - Social Network"
  },
  {
    id: 105,
    question: "Do you feel social media is more a positive thing, or more negative thing?",
    sampleAnswer: "That's a tricky one. I'd say social media has both positive and negative sides. On the one hand, it helps people stay connected, but on the other hand, it can also cause problems like addiction or spreading misinformation.",
    category: "Part 1 - Social Network"
  },
  {
    id: 106,
    question: "Do you use social media websites?",
    sampleAnswer: "Yes, I do. I use a few different platforms, but mainly LinkedIn for professional networking and Facebook for personal use.",
    category: "Part 1 - Social Network"
  },
  
  // Swimming
  {
    id: 107,
    question: "Do you like swimming?",
    sampleAnswer: "Yes, I do. I really enjoy swimming because it's both relaxing and a good way to stay healthy.",
    category: "Part 1 - Swimming"
  },
  {
    id: 108,
    question: "What do you think are the advantages of swimming?",
    sampleAnswer: "Well, in my opinion, swimming has many advantages. It's a full-body workout, it's gentle on the joints, and it can also be a lifesaving skill.",
    category: "Part 1 - Swimming"
  },
  {
    id: 109,
    question: "Did you learn to swim when you were young?",
    sampleAnswer: "Yes, I did. I remember learning how to swim at school during PE class, and it was actually quite fun.",
    category: "Part 1 - Swimming"
  },
  {
    id: 110,
    question: "Should it be compulsory for children to learn to swim when they are at school?",
    sampleAnswer: "Yes, I think so. Swimming is not only good for health, but also an essential safety skill that can prevent accidents.",
    category: "Part 1 - Swimming"
  },
  {
    id: 111,
    question: "How do most people in your country learn to swim?",
    sampleAnswer: "In Korea, I think most people learn to swim either at school or in public sports centers. There are also many private swimming pools where children take lessons.",
    category: "Part 1 - Swimming"
  },
  {
    id: 112,
    question: "Is swimming very popular in your country?",
    sampleAnswer: "Yes, it's quite popular. Many people enjoy swimming in the summer, and indoor pools are also common, so people can swim all year round.",
    category: "Part 1 - Swimming"
  },
  
  // Noise
  {
    id: 113,
    question: "Do you mind noises?",
    sampleAnswer: "Not really. I usually don't mind everyday noises, although loud construction sounds can be a bit annoying.",
    category: "Part 1 - Noise"
  },
  {
    id: 114,
    question: "What types of noise do you come across in your daily life?",
    sampleAnswer: "Well, I often hear traffic noise, people talking in public places, and sometimes music coming from shops or cafés.",
    category: "Part 1 - Noise"
  },
  {
    id: 115,
    question: "Are there any sounds that you like?",
    sampleAnswer: "Yes, I really like the sound of rain falling. It makes me feel calm and relaxed, especially when I'm at home.",
    category: "Part 1 - Noise"
  },
  {
    id: 116,
    question: "Where can you hear loud noises?",
    sampleAnswer: "You can usually hear loud noises on busy streets, near construction sites, or at concerts and festivals.",
    category: "Part 1 - Noise"
  },
  {
    id: 117,
    question: "Do you think there's too much noise in modern society?",
    sampleAnswer: "That's an interesting question. I think in modern society, there is definitely more noise because of heavy traffic, technology, and urban development. It can sometimes affect people's health and concentration.",
    category: "Part 1 - Noise"
  },
  {
    id: 118,
    question: "Are cities becoming noisier?",
    sampleAnswer: "Yes, I believe so. As cities grow bigger with more cars and construction, the noise levels naturally increase.",
    category: "Part 1 - Noise"
  },
  
  // Outdoor activities
  {
    id: 119,
    question: "What do you do in your spare time?",
    sampleAnswer: "In my free time, I usually watch Netflix while enjoying some delicious food. It helps me relax after a busy day.",
    category: "Part 1 - Outdoor Activities"
  },
  {
    id: 120,
    question: "Do you like outdoor activities?",
    sampleAnswer: "Yes, I do. I think outdoor activities are a great way to stay active and enjoy nature.",
    category: "Part 1 - Outdoor Activities"
  },
  {
    id: 121,
    question: "What outdoor activities do you like to do?",
    sampleAnswer: "I usually enjoy hiking and swimming, because they keep me healthy and give me a chance to spend time in nature.",
    category: "Part 1 - Outdoor Activities"
  },
  {
    id: 122,
    question: "How often do you do that?",
    sampleAnswer: "When I lived in Vancouver, I went hiking about once or twice a month because there were so many mountains nearby. But now in Montreal, I don't know the places well yet, so I haven't gone much.",
    category: "Part 1 - Outdoor Activities"
  },
  {
    id: 123,
    question: "What outdoor sports do you like?",
    sampleAnswer: "I like swimming and hiking the most, since they combine fitness with enjoying the outdoors.",
    category: "Part 1 - Outdoor Activities"
  },
  {
    id: 124,
    question: "How much time do you spend outdoors every week?",
    sampleAnswer: "On average, I'd say I spend about four to six hours outdoors each week, depending on the weather and my schedule.",
    category: "Part 1 - Outdoor Activities"
  },
  {
    id: 125,
    question: "What outdoor activities are popular in your country?",
    sampleAnswer: "In Korea, hiking is extremely popular because there are so many mountains. People also enjoy jogging, cycling, and playing soccer in parks.",
    category: "Part 1 - Outdoor Activities"
  },
  
  // Painting
  {
    id: 126,
    question: "Do you like painting or drawing?",
    sampleAnswer: "Not really. I don't draw very often, but I can still appreciate art when I see it.",
    category: "Part 1 - Painting"
  },
  {
    id: 127,
    question: "How often do you visit art galleries?",
    sampleAnswer: "Honestly, I don't visit them very often, maybe once or twice a year when there's a special exhibition.",
    category: "Part 1 - Painting"
  },
  {
    id: 128,
    question: "What kinds of things do you like to draw?",
    sampleAnswer: "If I do draw, I usually like to sketch simple things like nature scenes or small objects. But I'm not very skilled at it.",
    category: "Part 1 - Painting"
  },
  {
    id: 129,
    question: "Is it easy to learn how to draw?",
    sampleAnswer: "Well, I think drawing is not very easy. It takes a lot of practice and patience, although some people seem to have a natural talent for it.",
    category: "Part 1 - Painting"
  },
  
  // General Questions
  {
    id: 130,
    question: "Do you work or study at the moment?",
    sampleAnswer: "At the moment, I'm working in the software engineering field. It keeps me busy but also challenges me in a good way.",
    category: "Part 1 - General"
  },
  {
    id: 131,
    question: "What do you like doing in your free time?",
    sampleAnswer: "In my free time, I like to relax by watching Netflix or trying out new restaurants with friends.",
    category: "Part 1 - General"
  },
  {
    id: 132,
    question: "What type of photos do you like taking?",
    sampleAnswer: "I usually like taking photos of nature, like sunsets, beaches, and mountains, because they look beautiful and peaceful.",
    category: "Part 1 - General"
  },
  {
    id: 133,
    question: "What do you do with the photos you take?",
    sampleAnswer: "Most of the time, I just keep them on my phone, but sometimes I share them on social media with friends.",
    category: "Part 1 - General"
  },
  {
    id: 134,
    question: "When you visit other places, do you take photos or buy postcards?",
    sampleAnswer: "I usually take photos, because it feels more personal and captures the exact moment I experienced. Postcards don't really have that personal touch.",
    category: "Part 1 - General"
  },
  {
    id: 135,
    question: "Do you like people taking photos of you?",
    sampleAnswer: "Not really. I don't feel very comfortable in front of the camera, so I prefer taking photos of others or landscapes instead.",
    category: "Part 1 - General"
  },
  
  // Others
  {
    id: 136,
    question: "Talk about where you live",
    sampleAnswer: "I've been living in Montreal for three months now, and I really enjoy its vibrant vibe, with lots of shops, cozy cafes, and great public transport. Since French is the primary language here, it's a fantastic place to learn it, and I'm taking part-time French classes, which is fun but challenging.",
    category: "Part 1 - Others"
  },
  {
    id: 137,
    question: "Are you a student or do you work?",
    sampleAnswer: "I'm currently a software engineer, and I've been working in this field for eight years. My job involves designing and developing software applications, which I find it really fulfilling. I enjoy it because it's challenging and allows me to solve complex problems every day.",
    category: "Part 1 - Others"
  },
  {
    id: 138,
    question: "Talk about your job/studies",
    sampleAnswer: "I work as a senior software engineer, and my main role is to oversee the entire software development process. This includes designing applications, writing code, testing features, and deploying them to the production environment. I also enjoy mentoring junior developers, helping them improve their skills, which is really rewarding.",
    category: "Part 1 - Others"
  },
  {
    id: 139,
    question: "Where do you like to go on holiday?",
    sampleAnswer: "During holidays, I love spending time in a coffee shop. I enjoy the cozy atmosphere, sipping coffee while managing my upcoming schedule or working on side projects. It helps me stay focused and makes my holiday feel both productive and relaxing.",
    category: "Part 1 - Others"
  },
  {
    id: 140,
    question: "Do you have any hobbies?",
    sampleAnswer: "Yes, one of my favorite hobbies is watching Korean dramas on Netflix, especially shows like Squid Game because they're so exciting and well-produced. It's a great way for me to unwind after a long day, and I really enjoy how the English subtitles help me pick up new vocabulary.",
    category: "Part 1 - Others"
  },
  {
    id: 141,
    question: "What do you normally do in the evening?",
    sampleAnswer: "In the evening, I usually stay at home and watch Netflix. It helps me relax after a long day, and I find it quite enjoyable. Another reason I like doing this is that Netflix offers subtitles in different languages, so I often watch shows with English subtitles. That way, I can both enjoy the story and improve my language skills at the same time.",
    category: "Part 1 - Others"
  }
];

const part2Questions: Part2Question[] = [
  {
    id: 1,
    topic: "Weather",
    mainQuestion: "Describe a kind of weather you like",
    subQuestions: [
      "What it is",
      "Where you usually experience it", 
      "What you will do in this weather",
      "and explain why you like it"
    ],
    sampleAnswer: "One type of weather I really enjoy is hot and sunny weather. Bright sunshine and warm temperatures always put me in a good mood.\n\nI usually experience this weather when I visit Miami, Florida, which is famous for its beaches and tropical climate. The sun is almost always shining there, and the warmth near the ocean feels very inviting.\n\nDuring this weather, I love swimming, relaxing by the water, or fishing with friends. It's a perfect way to enjoy the outdoors and the lively atmosphere of the city.\n\nI like hot and sunny weather because it makes me feel energetic and carefree. I can wear light clothes comfortably, spend time outdoors, and it just leaves me with happy memories.",
    category: "Part 2 - Weather",
    part3Questions: [
      {
        id: 1,
        question: "What kinds of weather do people in your country like?",
        sampleAnswer: "In my country, people generally prefer mild weather. Most people enjoy spring and autumn because the temperature is comfortable and pleasant. However, some people also like summer for outdoor activities like swimming and hiking."
      },
      {
        id: 2,
        question: "Do you think weather affects people's mood?",
        sampleAnswer: "Yes, I think weather definitely affects people's mood. When it's sunny and warm, people tend to be more cheerful and energetic. On the other hand, when it's rainy or cloudy for many days, people might feel a bit down or less motivated."
      },
      {
        id: 3,
        question: "How has the weather changed in recent years?",
        sampleAnswer: "I think the weather has become more unpredictable in recent years. We're experiencing more extreme weather conditions, like hotter summers and more frequent heavy rain. This might be related to climate change."
      }
    ]
  },
  {
    id: 2,
    topic: "Place",
    mainQuestion: "Describe a place you would like to visit",
    subQuestions: [
      "Where it is",
      "How you know about this place",
      "What you would do there",
      "and explain why you would like to visit this place"
    ],
    sampleAnswer: "A place I would really like to visit is Japan, specifically Tokyo. I've always been fascinated by Japanese culture, technology, and cuisine.\n\nI know about this place through various sources - documentaries, travel shows, and friends who have visited. I've also read about its rich history and modern innovations.\n\nIf I could visit, I would explore the traditional temples and shrines, try authentic Japanese food like sushi and ramen, visit the famous Shibuya crossing, and experience the unique blend of old and new that Tokyo offers.\n\nI want to visit Japan because it represents the perfect balance between preserving tradition and embracing innovation. The culture seems so different from what I'm used to, and I think it would be an eye-opening experience.",
    category: "Part 2 - Place",
    part3Questions: [
      {
        id: 1,
        question: "What kinds of places do people in your country like to visit?",
        sampleAnswer: "People in my country generally like to visit places with beautiful nature, such as mountains, beaches, and national parks. They also enjoy visiting historical sites and cultural landmarks. Recently, many people are also interested in visiting trendy cafes and restaurants."
      },
      {
        id: 2,
        question: "Do you think it's better to travel alone or with others?",
        sampleAnswer: "I think both have their advantages. Traveling alone gives you more freedom and flexibility to do exactly what you want. However, traveling with others can be more fun and safer, especially in unfamiliar places. It also allows you to share experiences and create memories together."
      },
      {
        id: 3,
        question: "How has tourism changed in recent years?",
        sampleAnswer: "Tourism has changed significantly in recent years. Technology has made it easier to plan trips with online booking and travel apps. Social media has also influenced where people want to visit. However, the COVID-19 pandemic has had a major impact on international travel."
      }
    ]
  },
  {
    id: 3,
    topic: "People",
    mainQuestion: "Describe a person, much older than you, who you admire",
    subQuestions: [
      "Who this person is",
      "How you know this person",
      "What kinds of things you like to do together",
      "And explain why you admire this person"
    ],
    sampleAnswer: "The person I admire is the Queen Elizabeth II of the UK. She just turned to 90 years old this year, and she has been the queen of England for the longest period, 63 years altogether.\n\nThe queen visited Korea in 1999, when I was a child. It was big news for Korean people, and I watched news programmes on TV while she was staying in Korea. After that, I went to study in England, and read news, books, and journals about her and royal family so I got to know her more.\n\nWell, to be honest, I'd like to ask her some questions like how she feels, what her hobbies are - just ordinary stuff like I'm talking to my friend. Maybe we could have some tea, and talk to each other if possible.\n\nI admire her because she spent all of her life-time as the queen. I heard that she didn't want to be the queen of England when she was young as the role is a big burden for her. However after all, she did a great job to make England as one of the most powerful countries in the world. Also I think she is not afraid of trying new things out, which I am weak at. An article I read showed a picture of her using iPhone, and she is an early-adapter. It was quite surprising for me as I thought she would only respect tradition. I think that she is very open to new things. That's probably why she is beloved by many people.",
    category: "Part 2 - People",
    part3Questions: [
      {
        id: 1,
        question: "What kinds of people are most likely to choose to travel by plane?",
        sampleAnswer: "I think business people are most likely to choose to travel by plane because they need to save time and travel frequently. Also, people who can afford it and want convenience often choose planes. Some people who are afraid of other transportation methods also prefer planes."
      },
      {
        id: 2,
        question: "What do you think about travelling by plane?",
        sampleAnswer: "I think travelling by plane has both advantages and disadvantages. The obvious advantages are speed and convenience - you can travel long distances quickly. However, it can be expensive, and some people feel uncomfortable with the security procedures and potential delays."
      },
      {
        id: 3,
        question: "What are the advantages and disadvantages of living near an airport?",
        sampleAnswer: "Living near an airport has advantages like easy access to travel and often good transport connections. However, there are disadvantages like noise pollution from planes taking off and landing, and sometimes air pollution. Also, the area might be more expensive to live in."
      }
    ]
  },
  {
    id: 4,
    topic: "Plane",
    mainQuestion: "Describe a person (you know) that you would like to meet in the news",
    subQuestions: [
      "Who this person is",
      "What he or she does",
      "How you know this person",
      "And explain why you want to meet them"
    ],
    sampleAnswer: "A person I would like to meet from the news is Elon Musk. He is the CEO of Tesla and SpaceX, and he's known for his innovative work in electric cars and space exploration.\n\nI know about him through various news sources, social media, and documentaries. I've been following his work for several years, especially his efforts to make electric vehicles more accessible and his ambitious plans for Mars colonization.\n\nI would like to meet him because I'm fascinated by his vision for the future and his ability to turn ambitious ideas into reality. I think he would have interesting insights about technology, innovation, and the future of transportation and space travel. It would be amazing to hear his thoughts firsthand and ask him about his future plans.",
    category: "Part 2 - Plane",
    part3Questions: [
      {
        id: 1,
        question: "Do you think planes will have a negative influence in your country?",
        sampleAnswer: "Yes, it could have a negative impact. Yes, it might lead to severe effects, such as increased crime. Obsession with celebrities could cause depression. Some, especially business people, prefer traveling abroad."
      },
      {
        id: 2,
        question: "What kinds of people are most likely to choose to travel by plane?",
        sampleAnswer: "Newly married couples or those with specific preferences. Famous actors or global celebrities. And explain why they choose planes (e.g., time-saving)."
      },
      {
        id: 3,
        question: "Have you ever been to the UK?",
        sampleAnswer: "Some get travel opportunities, which can be intriguing. Discuss pros and cons of transport options. It's a complex question to address fully."
      },
      {
        id: 4,
        question: "What kinds of news are popular in your country?",
        sampleAnswer: "Celebrity news tends to draw attention. Stories about celebrities are widely followed. Interest in lives of those traveling to the USA or UK."
      },
      {
        id: 5,
        question: "What do you think about traveling by plane?",
        sampleAnswer: "Highlight the clear advantages of plane travel. Some travel for convenience, though it may not always feel typical. It can be time-consuming, with visits to other locations for various reasons."
      }
    ]
  },
  {
    id: 5,
    topic: "Celebrity/News",
    mainQuestion: "Describe a celebrity you admire",
    subQuestions: [
      "Who this person is",
      "What they are famous for",
      "How you know about them",
      "And explain why you admire them"
    ],
    sampleAnswer: "A celebrity I really admire is Tom Hanks. He is one of the most respected actors in Hollywood, known for his versatile performances in films like Forrest Gump, Cast Away, and The Green Mile.\n\nI know about him through his movies, interviews, and various media appearances. I've been watching his films since I was a child, and I've always been impressed by his ability to portray such diverse characters convincingly.\n\nI admire him because he seems like a genuinely good person both on and off screen. He's known for his professionalism, kindness, and positive attitude. Despite his fame, he appears to be humble and down-to-earth. I also respect his work ethic and the way he chooses meaningful projects that often have positive messages.",
    category: "Part 2 - Celebrity/News",
    part3Questions: [
      {
        id: 1,
        question: "What's the difference between broadcasting news in the past and in the present?",
        sampleAnswer: "Compare broadcasting with the press. Interesting news often takes precedence. Examples like USA and Canada business contexts."
      },
      {
        id: 2,
        question: "Why do you think people are so interested in celebrities' lives?",
        sampleAnswer: "Interest may grow from hearing about them during plane trips. Famous people offer more details to explore. The time spent learning about them adds to the fascination."
      },
      {
        id: 3,
        question: "What methods do you use to get news?",
        sampleAnswer: "Desire to meet someone due to their life story. Travel time example: Seoul to Busan (up to 3 hours). Compare plane travel with buses or trains."
      },
      {
        id: 4,
        question: "Do you believe everything said in the news?",
        sampleAnswer: "Not fully; skepticism is common. Shopping facilities near airports are notable. Censored or suppressed information by authorities."
      },
      {
        id: 5,
        question: "What are the advantages and disadvantages of living near an airport?",
        sampleAnswer: "Access to a dynamic environment is a plus. Noise pollution is a significant downside."
      },
      {
        id: 6,
        question: "Why do some people not watch TV news nowadays?",
        sampleAnswer: "It may feel irrelevant or far removed. Meeting an admired person could be more exciting. Preference for certain films or roles shapes preferences."
      }
    ]
  },
  {
    id: 6,
    topic: "The News",
    mainQuestion: "Describe a news story that interested you",
    subQuestions: [
      "What the news was about",
      "When you heard about it",
      "How you found out about it",
      "And explain why it interested you"
    ],
    sampleAnswer: "A news story that really interested me was about the successful landing of NASA's Perseverance rover on Mars in 2021. This was a major achievement in space exploration.\n\nI heard about this news in February 2021 when it was all over the media. It was a significant milestone in space exploration, and I was fascinated by the technology and engineering involved.\n\nI found out about it through various news sources, including social media, news websites, and television coverage. The story was everywhere because it was such a remarkable achievement.\n\nThis news interested me because I've always been fascinated by space exploration and the possibility of finding evidence of life on other planets. The technology involved in landing a rover on Mars is incredibly complex, and I was amazed by the scientists' ability to accomplish this feat. It also made me think about the future of space travel and what other discoveries might be possible.",
    category: "Part 2 - The News",
    part3Questions: [
      {
        id: 1,
        question: "Do you think the news will have a negative influence?",
        sampleAnswer: "Yes, negative news can impact people. Watching TV news might lead to depression. Curiosity about celebrities drives interest."
      },
      {
        id: 2,
        question: "What kinds of news do you think are popular in your country?",
        sampleAnswer: "Celebrity news is generally popular. People are keen to know about others' lives. Excessive news coverage influences various aspects."
      },
      {
        id: 3,
        question: "What's the difference between the news in the past and the present?",
        sampleAnswer: "Compare broadcasting with the press. Interesting news often comes first. Examples like USA and Canada business contexts."
      },
      {
        id: 4,
        question: "Why do you think people are so interested in news?",
        sampleAnswer: "Interest may stem from plane travel experiences. Famous people provide more details to explore. The time investment adds to the appeal."
      },
      {
        id: 5,
        question: "What methods do you use to get news nowadays?",
        sampleAnswer: "Desire to meet someone based on their life story. Travel time example: Seoul to Busan (up to 3 hours). Comparisons between plane, bus, or train travel."
      },
      {
        id: 6,
        question: "Do you believe everything said in the news?",
        sampleAnswer: "Not fully; trust varies. Shopping facilities near airports are a feature. Censorship by authorities can affect content."
      },
      {
        id: 7,
        question: "What are the advantages and disadvantages of living near an airport?",
        sampleAnswer: "Access to a dynamic environment is a plus. Noise pollution is a significant downside."
      },
      {
        id: 8,
        question: "Why do some people not watch TV news nowadays?",
        sampleAnswer: "It may feel irrelevant or far removed. Meeting an admired person could be more exciting. Preference for certain films or roles shapes preferences."
      }
    ]
  },
  {
    id: 7,
    topic: "Foreign Language",
    mainQuestion: "Describe a foreign language you would like to learn",
    subQuestions: [
      "What language it is",
      "How you would learn it",
      "Why you want to learn it",
      "And explain how it would be useful for you"
    ],
    sampleAnswer: "A foreign language I would really like to learn is Spanish. I think it's a beautiful and widely spoken language that would open up many opportunities for me.\n\nI would learn it through various methods - taking formal classes, using language learning apps, watching Spanish movies and TV shows, and practicing with native speakers. I believe immersion is the best way to learn a language effectively.\n\nI want to learn Spanish because it's spoken by millions of people around the world, especially in many countries in Latin America and Spain. It would be incredibly useful for travel, business, and cultural exchange.\n\nLearning Spanish would be very useful for me because it would enhance my career prospects, especially if I work in international business or tourism. It would also allow me to communicate with Spanish-speaking communities and understand their culture better.",
    category: "Part 2 - Foreign Language",
    part3Questions: [
      {
        id: 1,
        question: "Do many people in your country learn a foreign language?",
        sampleAnswer: "Yes, definitely. English is the most popular one among Korean people, but they learn some other languages like Japanese, Chinese, and so on. Many people tend to learn foreign languages due to different purposes."
      },
      {
        id: 2,
        question: "Can you explain why people learn foreign languages?",
        sampleAnswer: "In my opinion, people learn foreign languages in order to migrate or study in different country. For example, more Korean people tend to learn English in order to study abroad or for migration. Also they have to learn second language because of business purposes or for their own interests in a particular culture."
      },
      {
        id: 3,
        question: "Some people say that primary school is the best time to start learning a new language. Do you agree?",
        sampleAnswer: "Yes, I absolutely agree. Some people say children should start learning new language as young as they can, but I think nursery children should learn their own language first, and then start to learn new language when they go into primary school. They are still capable to adapt new knowledge quickly."
      },
      {
        id: 4,
        question: "What age do you think is better for a person to begin to learn a new language?",
        sampleAnswer: "Maybe around 6 or 7 years old, I believe. It's true that children absorb knowledge much faster and adapt a lot of useful information when learning something including languages than adults. But I personally think they shouldn't start learning two different languages at once until they reach the age of 6 or 7 as they can easily get mixed up with all new information."
      }
    ]
  },
  {
    id: 8,
    topic: "Food",
    mainQuestion: "Describe a time when you tried a new food for the first time",
    subQuestions: [
      "What food it was",
      "Where you ate it",
      "What it tasted like",
      "And explain whether or not you liked this food"
    ],
    sampleAnswer: "Around 3-4 years ago, I tried a new food for the first time at a new Spanish restaurant in Korea. The food was Paella, specifically the seafood one.\n\nIt looked like some kinds of stir-fried rice, but it was really new and exotic, not like Korean or European food. It actually tasted more like risotto. The rice wasn't that dry, and the seafood like shrimps and mussels were amazing. It was a bit salty but scrumptious. I finished it in about 10 minutes.\n\nI absolutely fell in love with Spanish cuisine including Paella, tapas, and others. It was very different to what I expected before I tried but it was truly awesome. I really liked everything we tried on that day and thought it would be wonderful if I really go to Spain and try the local food.",
    category: "Part 2 - Food",
    part3Questions: [
      {
        id: 1,
        question: "In your country, what are the most common (or, popular) food that people eat?",
        sampleAnswer: "I'd definitely say Korean traditional food is most common and popular in Korea. Also another booming one would be Italian as lots of Korean women like to eat Italian food, but generally speaking, it really depends on every individual."
      },
      {
        id: 2,
        question: "Do you think adults and children have the same attitudes towards food?",
        sampleAnswer: "I don't quite think so. It seems like adults eat food for survival. They need to get energy to work hard for the day but children tend not to eat something bitter or they don't like. Children usually only want to eat something sweet or delicious ones. Well, of course some adults do the same, but generally they tend to eat more healthily."
      },
      {
        id: 3,
        question: "Do you think it's important for adults to teach children concerning the food we eat?",
        sampleAnswer: "Absolutely. Adults should teach children everything from food to attitudes towards it. Children should realise the importance of nutrients rather than taste of a certain food, and also they need to learn about manners when eating food. I believe by teaching children about the food we eat, children can definitely pay attention not only to food but also something further like the environment or the animals."
      },
      {
        id: 4,
        question: "In general, would you say people in your country are willing to try new food?",
        sampleAnswer: "Not everyone though. It totally depends on their characteristics but I think some youngsters are adventurous enough to try new food nowadays. When something becomes trendy, people tend to try new things including food but not everyone."
      },
      {
        id: 5,
        question: "Who do you think is more willing to try a new food, children or adults?",
        sampleAnswer: "I'd say adults. From my surroundings, children only try something they already had before or tastes good. But as there are lots of adolescents and adults who have interests in other cultures, they are more open to try a new food when they have a chance."
      },
      {
        id: 6,
        question: "What kinds of foreign food are most common (or, most popular) in your country?",
        sampleAnswer: "Maybe Chinese or Japanese, I suppose. There are massive numbers of restaurants sell those food and also Italian is very famous one, too. Also nowadays, European cuisines are booming in Korea so lots of pubs and restaurants launched in many towns in Seoul."
      }
    ]
  },
  {
    id: 9,
    topic: "Anger",
    mainQuestion: "Describe a situation when you got a little angry",
    subQuestions: [
      "Where it happened",
      "When it happened",
      "Who you were with",
      "And explain why you felt angry"
    ],
    sampleAnswer: "Actually I faced a situation which made me quite angry last week. It was last week, at the bus stop. I was heading to my home when I finished the work. Before it happened, it was quite a tough day for me as I had lots of things to finish on that day.\n\nWhen I arrived at the bus stop, it was very crowded with lots of people as there are 5 or 6 bus stops altogether. There were like at least 50 people waiting for their buses, so I found mine then joined the queue. At that time, I was on my own, listening to music while waiting for the bus, and waited for about 20 minutes.\n\nThen when the bus came towards the stop, a young girl suddenly came up somewhere and jumped in the queue right before me. I was so annoyed since I waited for 20 minutes, and there were tons of people behind me. I'm sure most people felt the same thing as me. So people started to yell at her, then she went back of the queue at the end. It was such a frustrating situation, and hope not to experience such thing again.",
    category: "Part 2 - Anger",
    part3Questions: [
      {
        id: 1,
        question: "What would you do if you make others angry at you?",
        sampleAnswer: "Well, if it happens, I tend to talk to them first to sort the problem out. I just try to find out what they think and what made them upset, then apologise when it comes to my fault. But if they are just being aggressive, I just ignore them."
      },
      {
        id: 2,
        question: "In what ways can people manage their anger well?",
        sampleAnswer: "Maybe they can take deep breath first of all. They can think over the situation that made them upset then take an action. Also people can enjoy things that will make them feel lifted. In my case, I tend to control my anger by watching something funny."
      },
      {
        id: 3,
        question: "Will working late at night influence the next day's work?",
        sampleAnswer: "Yes, most definitely. I believe that working late at night will negatively affect the next day's work. It can lead to fatigue, reduced productivity, and difficulty concentrating. For example, I once had to attend a meeting at 10 AM, but I had worked until 2 AM the previous night. As a result, I was exhausted and struggled to focus during the meeting. I ended up making several mistakes and felt very frustrated. Since then, I try to avoid working late at night whenever possible."
      },
      {
        id: 4,
        question: "Do young people in your country stay up late at night?",
        sampleAnswer: "I think so. From my surroundings, many youngsters tend to sleep late as they normally play computer games or smart phone games. Also secondary school students usually stay up until late due to huge amount of study."
      },
      {
        id: 5,
        question: "What kinds of things make people angry?",
        sampleAnswer: "I think people get angry for various reasons. Some common triggers include unfair treatment, disrespect, long waiting times, and when others don't follow rules or social norms. Also, stress from work or personal life can make people more easily irritated."
      }
    ]
  },
  {
    id: 10,
    topic: "Foreign Language Communication",
    mainQuestion: "Describe the first time you used a foreign language to communicate",
    subQuestions: [
      "Who you communicated with",
      "What you said or wrote",
      "What the situation was",
      "And explain how you felt during this experience"
    ],
    sampleAnswer: "When I was 14 years old, I went to England to study so that was the first moment I communicated in a foreign language. A minute after the airplane landed at Heathrow airport in London, I was so excited and everything looked so different. Then I faced really big challenge, I had to talk in English at the immigration inspection.\n\nI was all alone and got to talk to one of the staffs and she seemed not happy as I couldn't really speak English much. She came up with some basic questions like what my purpose of entry is, how long I am going to stay in England, and other questions related to immigration. I was very nervous and couldn't really think of good answers so I mumbled a lot. I don't clearly remember what I really said, but I assume my answers were not quite relevant to the situation. It was like a nightmare. There was huge queue behind me, the immigration officer was staring at me, and I was scared by the situation so couldn't even speak a single thing. So she made me to stay at the airport for like 5 hours until a translator came.\n\nIt was quite embarrassing experience. I felt really embarrassing while sitting in the immigration office. I thought it happened because I wasn't good at English so kind of decided to study hard. Also I felt quite scary. I thought that I would be sent to Korea straight after I reached England, and actually saw a few people going back to their country because they couldn't obtain visa on that day. So I felt really nervous until I came out of the airport, I didn't want to go back on the first day I arrived in England. After that, I never had the same experience, and don't want to experience similar situation whenever I travel.",
    category: "Part 2 - Foreign Language Communication",
    part3Questions: [
      {
        id: 1,
        question: "Do many people in your country learn a foreign language?",
        sampleAnswer: "Yes, definitely. English is the most popular one among Korean people, but they learn some other languages like Japanese, Chinese, and so on. Many people tend to learn foreign languages due to different purposes."
      },
      {
        id: 2,
        question: "Can you explain why people learn foreign languages?",
        sampleAnswer: "In my opinion, people learn foreign languages in order to migrate or study in different country. For example, more Korean people tend to learn English in order to study abroad or for migration. Also they have to learn second language because of business purposes or for their own interests in a particular culture."
      },
      {
        id: 3,
        question: "Some people say that primary school is the best time to start learning a new language. Do you agree?",
        sampleAnswer: "Yes, I absolutely agree. Some people say children should start learning new language as young as they can, but I think nursery children should learn their own language first, and then start to learn new language when they go into primary school. They are still capable to adapt new knowledge quickly."
      },
      {
        id: 4,
        question: "What age do you think is better for a person to begin to learn a new language?",
        sampleAnswer: "Maybe around 6 or 7 years old, I believe. It's true that children absorb knowledge much faster and adapt a lot of useful information when learning something including languages than adults. But I personally think they shouldn't start learning two different languages at once until they reach the age of 6 or 7 as they can easily get mixed up with all new information."
      }
    ]
  },
  {
    id: 11,
    topic: "Weather Plans",
    mainQuestion: "Describe a time when the weather caused you to change your plans",
    subQuestions: [
      "What your plan was",
      "What weather you were hoping for",
      "What happened",
      "And explain how you felt when you had to change your plans"
    ],
    sampleAnswer: "Well, there was a moment that I had to change my schedule because of heavy storm while I was studying at the university. I was supposed to meet a pen friend in London, who was visiting for the first time. I had meticulously planned her visit, including places to see and where to eat, aiming for her to have a good time.\n\nI hoped for pleasant and warm weather for her visit in March. Before her arrival, the weather was not bad compared to normal British weather, with no strong wind, sunny skies, and no rain for weeks.\n\nUpon her friend's arrival, the weather turned really bad. A strongest storm in 30 years was about to hit, and it started raining cats and dogs, continuing throughout her visit.\n\nI felt really frustrated because my plans to visit many tourist attractions became useless. As someone who dislikes changing plans, I found it quite stressful and get really upset whenever I have to change something from my plan even though it's because of the weather. However, there was a positive side: we could talk, enjoy the view of rainy London, and felt quite relaxed. We managed to take some pictures of the London Eye and Big Ben and had a lovely dinner together. Although the weather wasn't perfect, it was not a bad day.",
    category: "Part 2 - Weather Plans",
    part3Questions: [
      {
        id: 1,
        question: "What kind of weather do people in your country prefer?",
        sampleAnswer: "Definitely warm and pleasant weather. As the weather in Korea changes by the season, the weather in summer or winter is quite extreme. So people seem to prefer the weather in spring. The weather in spring is normally warm, sunny, and gentle breeze make people want to go outside."
      },
      {
        id: 2,
        question: "In general, do people in your country pay attention to the weather forecasts?",
        sampleAnswer: "Generally speaking, most Korean people watch weather forecasting reports on TV every day. For businessmen, they tend to watch it because they can estimate the traffic if it's raining or snowing. Also if people plan to do some outdoor activities, they pay extra attention to it since they want very pleasant weather when they go out."
      },
      {
        id: 3,
        question: "Which people do you think pay more attention to the weather than other people?",
        sampleAnswer: "The first one came up on my mind is the ones who work outside like builders as they spend majority of their time working outside. Also maybe salesman or taxi drivers might be the ones as they have to drive all day."
      },
      {
        id: 4,
        question: "Are weather forecasts in your country usually accurate?",
        sampleAnswer: "When it rains or snows, they are mostly accurate and reliable. But in most cases, they aren't. I think they broadcast wrong information once in five times at least, and most people don't quite believe the weather information they provide."
      },
      {
        id: 5,
        question: "What different activities do people do in different seasons?",
        sampleAnswer: "In sports wise, people go for water sports in summer, for instance, swimming, wakeboarding, and water skiing. And I think people tend to travel more in summer as most companies provide annual holiday at that season. In winter, winter sports such as skiing and snowboarding are very popular amongst Korean people so many people go and enjoy different activities in different seasons."
      },
      {
        id: 6,
        question: "Can you think of some examples of how the weather can have an impact on people doing certain jobs?",
        sampleAnswer: "I'd say constructors are the ones whose job is dependent on the weather. They normally work outside in order to build buildings, so it's unlikely for them that they can continue with their work when it rains or snows. Also electricians might be the ones as their job is highly risky when the weather is bad. So they might not be able to do their work."
      }
    ]
  },
  {
    id: 12,
    topic: "Getting Up Early",
    mainQuestion: "Describe an occasion you got up extremely early",
    subQuestions: [
      "When this happened",
      "What you needed to do that day",
      "Who you were with",
      "And how you felt about getting up early that day"
    ],
    sampleAnswer: "I'm actually quite used to getting up early in the morning but I think I got up around 4 in the morning to catch a train around 5 years ago. I thought it would be like a nightmare because I never woke up that early before.\n\nOn that specific day, I had to attend a business meeting which was held in Birmingham. As I was travelling by a train with one of my colleagues, we had to book the tickets in advance. Strangely, most trains were fully booked so only one that we could find seats was departing at 5:20 in the morning. Of course we couldn't miss the meeting so had to take that train so we met at Waterloo station at around 4:40 am. I was quite afraid of myself becoming too exhausted in the meeting since I woke up too early.\n\nWell, although I'm a morning person, I never got up before 5 in the morning so it was quite tired. At first when I left home, everywhere was so quiet and dark so I couldn't really see a thing. It was truly odd to walk a street where there's no one around. And even my colleague and I managed to sleep on the train, we were exhausted when we got back to London. I thought the day passes really slowly. Also I quite liked the atmosphere of the early morning. It was really dark and chilly, but I felt I'm quite lively and pleased. So even I woke up really early, I think the day wasn't that bad as I expected.",
    category: "Part 2 - Getting Up Early",
    part3Questions: [
      {
        id: 1,
        question: "Who usually get up early, young people or old people?",
        sampleAnswer: "Probably old people, I presume. Young people tend to stay up until late night so they usually sleep until late morning, or even midday. But most old people wake up early in the morning and start their day earlier than young ones. I think as people grow older, they have to wake up early in the morning."
      },
      {
        id: 2,
        question: "Will working late at night influence the next day's work?",
        sampleAnswer: "Yes, definitely. Normally when people work until late night, they can't concentrate much and feel more tired on the next day. It wouldn't make them to be productive or work hard like the other days."
      },
      {
        id: 3,
        question: "Do young people in your country stay up late at night?",
        sampleAnswer: "I think so. From my surroundings, many youngsters tend to sleep late as they normally play computer games or smart phone games. Also secondary school students usually stay up until late due to huge amount of study."
      },
      {
        id: 4,
        question: "Is it easy to get up early for you?",
        sampleAnswer: "Yes, I wake up around 5 in the morning every day even in the weekends. When I get up early, I can do more things on that day. And as I prefer to work in the morning, I tend not to sleep long."
      },
      {
        id: 5,
        question: "What do you do to guarantee a good sleep?",
        sampleAnswer: "I use eye sleeping shades when it's noisy or bright. I turn everything off around me to sleep well. I aim for a good sleep every night, typically for around 3 to 4 hours, as I sleep relatively shorter hours. It's rare for me not to sleep well, but when struggling, I drink warm tea or milk to relax."
      },
      {
        id: 6,
        question: "Can you sleep well if there is noise around?",
        sampleAnswer: "No, not at all. I am very sensitive at noise and can't sleep at all if there's any noise around. When I'm really tired or need good sleep, I sometimes use earplugs to sleep deeply."
      }
    ]
  }
];

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'ielts' | 'tefSelection' | 'tefWriting' | 'tefSpeaking'>('landing');
  const [currentPart, setCurrentPart] = useState<'part1' | 'part2' | 'part3'>('part1');
  const [currentQuestion, setCurrentQuestion] = useState<Question>(sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)]);
  const [currentPart2Question, setCurrentPart2Question] = useState<Part2Question>(part2Questions[0]);
  const [currentPart3Question, setCurrentPart3Question] = useState<Part3Question>(part2Questions[0].part3Questions[0]);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [geminiAnalysis, setGeminiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);




  const getRandomQuestion = () => {
    if (currentPart === 'part1') {
      const randomIndex = Math.floor(Math.random() * sampleQuestions.length);
      const randomQuestion = sampleQuestions[randomIndex];
      setCurrentQuestion(randomQuestion);
    } else if (currentPart === 'part2') {
      const randomIndex = Math.floor(Math.random() * part2Questions.length);
      const randomPart2Question = part2Questions[randomIndex];
      setCurrentPart2Question(randomPart2Question);
    } else if (currentPart === 'part3') {
      const randomPart2Index = Math.floor(Math.random() * part2Questions.length);
      const randomPart2Question = part2Questions[randomPart2Index];
      const randomPart3Index = Math.floor(Math.random() * randomPart2Question.part3Questions.length);
      const randomPart3Question = randomPart2Question.part3Questions[randomPart3Index];
      setCurrentPart3Question(randomPart3Question);
    }
    setUserAnswer('');
    setSimilarityScore(null);
    setShowResult(false);
  };

  const handleRecordingComplete = (transcript: string) => {
    setUserAnswer(transcript);
    setCurrentTranscript('');
    setIsRecording(false);
  };

  const calculateSimilarity = async () => {
    if (!userAnswer.trim()) return;
    
    setIsAnalyzing(true);
    setGeminiAnalysis(null);
    
    let sampleAnswer = '';
    let question = '';
    
    if (currentPart === 'part1') {
      sampleAnswer = currentQuestion.sampleAnswer;
      question = currentQuestion.question;
    } else if (currentPart === 'part2') {
      sampleAnswer = currentPart2Question.sampleAnswer;
      question = currentPart2Question.mainQuestion;
    } else if (currentPart === 'part3') {
      sampleAnswer = currentPart3Question.sampleAnswer;
      question = currentPart3Question.question;
    }
    
    try {
      // Gemini API 호출 (환경에 따라 자동 선택)
      const lambdaUrl = process.env.REACT_APP_LAMBDA_FUNCTION_URL;
      const data = await analyzeWithGemini(
        {
          userAnswer,
          sampleAnswer,
          question,
          analysisType: 'similarity'
        },
        lambdaUrl
      );
      
      console.log('Gemini API 응답:', data); // 디버깅용
      
      if (data.success && data.analysis) {
        // Gemini 분석 결과 처리
        console.log('Gemini 분석 결과:', data.analysis); // 디버깅용
        setGeminiAnalysis(data.analysis);
        
        // 유사도 점수 추출
        if (data.analysis.similarityScore !== undefined) {
          setSimilarityScore(data.analysis.similarityScore);
        } else if (data.analysis.overallScore !== undefined) {
          setSimilarityScore(data.analysis.overallScore);
        } else {
          // 점수를 찾을 수 없으면 기본 계산 사용
    const userWords = userAnswer.toLowerCase().split(/\s+/);
    const sampleWords = sampleAnswer.toLowerCase().split(/\s+/);
    const commonWords = userWords.filter(word => sampleWords.includes(word));
    const similarity = (commonWords.length / Math.max(userWords.length, sampleWords.length)) * 100;
          setSimilarityScore(Math.round(similarity));
        }
        
        setShowResult(true);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing with Gemini:', error);
      // 에러 발생 시 기본 유사도 계산 사용
      const userWords = userAnswer.toLowerCase().split(/\s+/);
      const sampleWords = sampleAnswer.toLowerCase().split(/\s+/);
      const commonWords = userWords.filter(word => sampleWords.includes(word));
      const similarity = (commonWords.length / Math.max(userWords.length, sampleWords.length)) * 100;
    setSimilarityScore(Math.round(similarity));
    setShowResult(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (currentView === 'landing') {
    return (
      <LandingPage
        onSelectIELTS={() => setCurrentView('ielts')}
        onSelectTEF={() => setCurrentView('tefSelection')}
      />
    );
  }

  if (currentView === 'tefSelection') {
    return (
      <div className="App">
        <header className="App-header">
          <button 
            onClick={() => setCurrentView('landing')}
            className="back-button"
            style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            ← 뒤로 가기
          </button>
          <h1>🇫🇷 TEF Canada</h1>
        </header>
        <main className="App-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              onClick={() => setCurrentView('tefWriting')}
              className="exam-button tef-button"
              style={{ 
                padding: '40px 60px', 
                fontSize: '1.2rem',
                cursor: 'pointer',
                border: 'none',
                borderRadius: '15px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 5px 20px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 5px 20px rgba(102, 126, 234, 0.3)';
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>✍️</div>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Expression Écrite</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Writing (라이팅)</div>
            </button>
            
            <button 
              onClick={() => setCurrentView('tefSpeaking')}
              className="exam-button tef-button"
              style={{ 
                padding: '40px 60px', 
                fontSize: '1.2rem',
                cursor: 'pointer',
                border: 'none',
                borderRadius: '15px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 5px 20px rgba(102, 126, 234, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 5px 20px rgba(102, 126, 234, 0.3)';
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🎤</div>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Expression Orale</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Speaking (스피킹)</div>
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (currentView === 'tefWriting') {
    return (
      <TEFWriting onBack={() => setCurrentView('tefSelection')} />
    );
  }

  if (currentView === 'tefSpeaking') {
    return (
      <TEFSpeaking onBack={() => setCurrentView('tefSelection')} />
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
            onClick={() => setCurrentView('landing')}
            className="back-button"
            style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            ← 뒤로 가기
          </button>
          <h1>🎤 IELTS 스피킹 연습</h1>
        </div>
      </header>
      
      <main className="App-main">
        <div className="part-selector">
          <button 
            onClick={() => {
              setCurrentPart('part1');
              setUserAnswer('');
              setCurrentTranscript('');
              setSimilarityScore(null);
              setShowResult(false);
            }} 
            className={`part-button ${currentPart === 'part1' ? 'active' : ''}`}
          >
            Part 1
          </button>
          <button 
            onClick={() => {
              setCurrentPart('part2');
              setUserAnswer('');
              setCurrentTranscript('');
              setSimilarityScore(null);
              setShowResult(false);
            }} 
            className={`part-button ${currentPart === 'part2' ? 'active' : ''}`}
          >
            Part 2
          </button>
          <button 
            onClick={() => {
              setCurrentPart('part3');
              setUserAnswer('');
              setCurrentTranscript('');
              setSimilarityScore(null);
              setShowResult(false);
            }} 
            className={`part-button ${currentPart === 'part3' ? 'active' : ''}`}
          >
            Part 3
          </button>
        </div>

        <div className="question-controls">
          <button onClick={getRandomQuestion} className="random-button">
            🎲 랜덤 문제 선택
          </button>
          
          {currentPart === 'part1' && (
            <div className="topic-selector">
              <h4>카테고리별 선택:</h4>
              <div className="topic-buttons">
                {Array.from(new Set(sampleQuestions.map(q => q.category))).map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      const categoryQuestions = sampleQuestions.filter(q => q.category === category);
                      const randomQuestion = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];
                      setCurrentQuestion(randomQuestion);
                      setUserAnswer('');
                      setCurrentTranscript('');
                      setSimilarityScore(null);
                      setShowResult(false);
                    }}
                    className={`topic-button ${currentQuestion.category === category ? 'active' : ''}`}
                  >
                    {category.replace('Part 1 - ', '')}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {currentPart === 'part2' && (
            <div className="topic-selector">
              <h4>주제별 선택:</h4>
              <div className="topic-buttons">
                {part2Questions.map((question) => (
                  <button
                    key={question.id}
                    onClick={() => {
                      setCurrentPart2Question(question);
                      setUserAnswer('');
                      setCurrentTranscript('');
                      setSimilarityScore(null);
                      setShowResult(false);
                    }}
                    className={`topic-button ${currentPart2Question.id === question.id ? 'active' : ''}`}
                  >
                    {question.topic}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {currentPart === 'part3' && (
            <div className="topic-selector">
              <h4>주제별 선택:</h4>
              <div className="topic-buttons">
                {part2Questions.map((question) => (
                  <button
                    key={question.id}
                    onClick={() => {
                      const randomPart3Index = Math.floor(Math.random() * question.part3Questions.length);
                      const randomPart3Question = question.part3Questions[randomPart3Index];
                      setCurrentPart3Question(randomPart3Question);
                      setUserAnswer('');
                      setCurrentTranscript('');
                      setSimilarityScore(null);
                      setShowResult(false);
                    }}
                    className={`topic-button`}
                  >
                    {question.topic}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {currentPart === 'part1' ? (
          <QuestionCard question={currentQuestion} />
        ) : currentPart === 'part2' ? (
          <div className="part2-question">
            <h2>{currentPart2Question.topic}</h2>
            <h3>{currentPart2Question.mainQuestion}</h3>
            <div className="sub-questions">
              <p>You should say:</p>
              <ul>
                {currentPart2Question.subQuestions.map((subQ, index) => (
                  <li key={index}>{subQ}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="part3-question">
            <h2>Part 3 - Discussion Question</h2>
            <h3>{currentPart3Question.question}</h3>
            <details className="sample-answer">
              <summary>Sample Answer</summary>
              <p>{currentPart3Question.sampleAnswer}</p>
            </details>
          </div>
        )}
        
        <SpeechRecognition
          isRecording={isRecording}
          onStartRecording={() => {
            setIsRecording(true);
            setCurrentTranscript('');
          }}
          onStopRecording={() => setIsRecording(false)}
          onRecordingComplete={handleRecordingComplete}
          onTranscriptUpdate={setCurrentTranscript}
        />

        {isRecording && (
          <div className="user-answer">
            <h3>🎤 실시간 음성 인식:</h3>
            <p style={{ fontStyle: 'italic', color: '#666' }}>
              {currentTranscript || '음성을 인식하고 있습니다...'}
            </p>
          </div>
        )}

                {userAnswer && !isRecording && (
          <div className="user-answer">
            <h3>🎤 당신의 답변:</h3>
            <p>{userAnswer}</p>
            <button 
              onClick={calculateSimilarity} 
              className="compare-button"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? '🤖 AI 분석 중...' : '📊 유사도 분석하기'}
            </button>
          </div>
        )}

        {showResult && similarityScore !== null && (
          <ResultDisplay
            similarityScore={similarityScore}
            userAnswer={userAnswer}
            sampleAnswer={
              currentPart === 'part1' 
                ? currentQuestion.sampleAnswer 
                : currentPart === 'part2'
                ? currentPart2Question.sampleAnswer
                : currentPart3Question.sampleAnswer
            }
            geminiAnalysis={geminiAnalysis}
            isAnalyzing={isAnalyzing}
          />
        )}
      </main>
    </div>
  );
}

export default App;
