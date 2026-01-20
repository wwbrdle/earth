import React, { useMemo, useState } from 'react';
import { analyzeWithGemini, buildGeminiPrompt } from '../utils/geminiApi';

type WritingSection = 'task1' | 'task2';

interface WritingPrompt {
  id: number;
  prompt: string;
}

interface Task1Topic {
  id: number;
  title: string;
  guidance?: string;
  guidanceForScreen?: React.ReactNode;
  sampleAnswer?: string;
  imagePaths?: string[];
}

export const task1Topics: Task1Topic[] = [
  {
    id: 1,
    title: 'Single line graph',
    guidance: `Single line graph

How to start
"The graph describes/shows/presents/reveals ... (what, who, when, where)."
"It can be clearly seen that ... (describe main trends here)."

Vocabulary
When describing such a graph, all you can say is that it either rises (increases, climbs, goes up), falls (decreases, declines, drops, goes down), doesn't change (remains at the same level, maintains stability, plateaus). The highest point of a graph is a peak and the lowest is the lowest point. The speed of change also matters - you should say how fast (rapidly, quickly) or how slowly (gradually, steadily) it happened. And, of course, there is order to changes - a rise was preceded by a drop and followed by a decline.

How to describe trends
Numbers are boring, so you need to add a little "color" when describing them. By "color" I mean comparison. Don't just write "went from 100 in 1999 to 255 in 2001". Write "significantly increased to 255" or "had risen to 255". Make sure to mention the peak and trough of the line graph (its highest and lowest values), see example below.`,
    guidanceForScreen: (
      <div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>Single line graph</div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>How to start</div>
        <div style={{ marginBottom: '6px' }}>
          <strong>"The graph</strong> describes/shows/presents/reveals ... <em>(what, who, when, where).</em>"
        </div>
        <div style={{ marginBottom: '14px' }}>
          "It can be clearly seen that ... <em>(describe main trends here).</em>"
        </div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>Vocabulary</div>
        <div style={{ marginBottom: '14px' }}>
          When describing such a graph, all you can say is that it either <strong>rises</strong> (increases, climbs, goes up),
          <strong> falls</strong> (decreases, declines, drops, goes down), <strong>doesn't change</strong> (remains at the same level,
          maintains stability, plateaus). The highest point of a graph is a <strong>peak</strong> and the lowest is the{' '}
          <strong>lowest point</strong>. The speed of change also matters - you should say how <strong>fast</strong> (rapidly, quickly) or
          how <strong>slowly</strong> (gradually, steadily) it happened. And, of course, there is order to changes - a rise was{' '}
          <strong>preceded</strong> by a drop and <strong>followed</strong> by a decline.
        </div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>How to describe trends</div>
        <div>
          Numbers are boring, so you need to add a little "color" when describing them. By "color" I mean <em>comparison</em>.
          Don't just write "went from 100 in 1999 to 255 in 2001". Write "significantly increased to 255" or "had risen to 255".
          Make sure to mention the peak and trough of the line graph (its highest and lowest values), see example below.
        </div>
      </div>
    )
    ,
    sampleAnswer: `The graph shows the percentages of unemployed women aged between 18 and 65.

It can be clearly seen that the 18 and 45 year-old women are most likely to be unemployed, while the figures for other ages are relatively uniform.

According to the graph, among the ages from 18 to 35, the youngest women have the highest unemployment percentage (15%). Slightly older, 20 year-old women are more likely to be employed, with unemployment at about 10%. The percentages drop even lower (to 5 percent) for those aged 25 and 35. There is a slight increase for those aged 30, where the unemployment rate reaches 6 percent.

The sharp rise to 20% breaks the downward trend, with the peak value recorded amongst 45 year-old women. All the remaining ages have much lower figures, 8% at the age of 55 and 9% at the age of 65; however, this is still considerably higher compared to 25 to 35 year-old females.`,
    imagePaths: ['/ielts/task1-single-line-graph.png'],
  },
  {
    id: 2,
    title: 'Double line graph',
    guidance: `Double line graph

How to start
"The graph compares ... (what, who, when, where)."
"It can be clearly seen that / Overall, it can be seen that ... (describe main trends of 2 lines here)."

Vocabulary
The same as for the single line graph.

How to compare lines
The easiest way is to go along the horizontal axis X, comparing the two lines. You can talk about every point on the axis X and compare or contrast the values of the two lines, or if there are many points and some of them form a trend (upwards/downwards/etc.) you can group them and talk about that entire part of the graph.

Here are some expressions to compare values: "much more/significantly less, twice as much, (almost) identical, very close, far apart, a large gap between..."

Describe trends using words such as "grew/declined further, climbed/plunged, upward/downward trend, experienced rapid growth/a downturn, became more/less popular or widespread, reached its peak/lowest point, peaked/bottomed".

You should also compare the peaks and troughs of the two lines, see example below.`,
    guidanceForScreen: (
      <div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>Double line graph</div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>How to start</div>
        <div style={{ marginBottom: '6px' }}>
          <strong>"The graph compares</strong> ... <em>(what, who, when, where).</em>"
        </div>
        <div style={{ marginBottom: '14px' }}>
          "It can be clearly seen that / Overall, it can be seen that ... <em>(describe main trends of 2 lines here).</em>"
        </div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>Vocabulary</div>
        <div style={{ marginBottom: '14px' }}>
          The same as for the single line graph.
        </div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>How to compare lines</div>
        <div style={{ marginBottom: '10px' }}>
          The easiest way is to go along the horizontal axis X, comparing the two lines. You can talk about every point on the
          axis X and compare or contrast the values of the two lines, or if there are many points and some of them form a trend
          (upwards/downwards/etc.) you can group them and talk about that entire part of the graph.
        </div>
        <div style={{ marginBottom: '10px' }}>
          Here are some expressions to compare values: <strong>"much more/significantly less, twice as much, (almost) identical, very close, far apart, a large gap between..."</strong>
        </div>
        <div style={{ marginBottom: '10px' }}>
          Describe trends using words such as <strong>"grew/declined further, climbed/plunged, upward/downward trend, experienced rapid growth/a downturn, became more/less popular or widespread, reached its peak/lowest point, peaked/bottomed".</strong>
        </div>
        <div>
          You should also compare the peaks and troughs of the two lines, see example below.
        </div>
      </div>
    ),
    sampleAnswer: `The graph compares the amounts of money spent online on clothes in the USA and Japan starting from 1999 and until 2003.

It is clear that although at first Japanese buyers were spending much more money than Americans did, as the years went by the spending habits of the 2 countries became almost identical.

In 1999 Japan was spending on clothes almost twice as much as the USA (10 million versus 5 million dollars). In the following year the expenditure on clothes in both Japan and USA grew even further to 12 and 10 million dollars respectively, narrowing the gap between the two countries.

2001 was the only year when expenses plunged in both countries, with the USA spending only 8 million and Japan reaching its lowest point at 7 million dollars.

Resuming the upward trend in 2002 and 2003, sales of clothes rebounded in both countries. In 2002 the USA spent about 19 million dollars and Japan's numbers were very close (18 million). Online clothes sales became even more popular in 2003, pushing the figures higher to their peaks of 20 million dollars in both Japan and the USA.`,
    imagePaths: ['/ielts/task1-double-line-graph.png']
  },
  {
    id: 3,
    title: 'Bar graph',
    guidance: `Bar graph

How to start
For a single bar graph: "The graph describes/shows/reveals ... (what, who, when, where)."
For multiple bars graphs: "The graph compares ... (what, who, when, where)."

"It can be clearly seen that ... (describe main trends here)."

Vocabulary
The same as for single / double line graph.

How to describe or compare trends
If the axis of the bar graph is a time scale - describe how the graph's subject changes in time. Otherwise compare the bars differently - more, less, most, least, etc., in order of appearance or you could group the countries with similar numbers together.`,
    guidanceForScreen: (
      <div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>Bar graph</div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>How to start</div>
        <div style={{ marginBottom: '6px' }}>
          <u>For a single bar graph:</u> <strong>"The graph describes/shows/reveals</strong> ... <em>(what, who, when, where).</em>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <u>For multiple bars graphs:</u> <strong>"The graph compares</strong> ... <em>(what, who, when, where).</em>
        </div>
        <div style={{ marginBottom: '14px' }}>
          "It can be clearly seen that ... <em>(describe main trends here).</em>"
        </div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>Vocabulary</div>
        <div style={{ marginBottom: '14px' }}>
          The same as for single / double line graph.
        </div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>How to describe or compare trends</div>
        <div>
          If the axis of the bar graph is a time scale - describe how the graph's subject changes in time. Otherwise compare the
          bars differently - more, less, most, least, etc., in order of appearance or you could group the countries with similar
          numbers together.
        </div>
      </div>
    ),
    sampleAnswer: `The bar chart compares the amounts of coffee and meat consumed every year in Norway, France, Germany, the USA, Russia, China and Japan, in kg per person.

It can be clearly seen that all the 7 countries consume much more meat than coffee.

The lowest rates of coffee consumption are recorded in China and Japan (2 and 3 kg per person respectively). Three countries with somewhat higher rates are the USA (4 kg per person) and France and Russia with equal consumption rates of 5 kg per person. The highest numbers belong to Germany and Norway, at 7 and 9 kg per person respectively.

The figures for meat are significantly different. The most meat is eaten in the USA (122 kg per person) and the least in Japan, just 42 kg per person. Meat consumption in Russia and China, at 45 and 47 kg per person respectively, is similar to that of Japan. Three other countries have much higher numbers, starting with Norway at 60 kg per person and progressing through to France (72kg) and Germany, where people eat about twice as much meat as in Japan (87 kg per person).`,
    imagePaths: ['/ielts/task1-bar-graph.png']
  },
  {
    id: 4,
    title: 'Pie chart',
    guidance: `Pie chart

How to start
"The pie charts compare... (what, who, when, where)."

"It can be clearly seen that ... (describe the most noticeable feature)."

Vocabulary
When describing a pie chart, write about the highest (significant, lowest) percentage, the majority (minority), the greatest (smallest) proportion, the lowest number, the most (least) popular (common) item, etc.

If there is a slice representing 25%, you could write "a quarter", 50% - "a half", 75% - "three quarters".

How to describe and compare pie charts
Describe and compare the slices one by one. Make sure to mention the biggest and smallest.

If a certain slice is two or three times bigger than another, you could write "twice (three times) as many Xs were used as Ys". Another idea is to write "X is much more (or considerably less) common than Y".`,
    guidanceForScreen: (
      <div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>Pie chart</div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>How to start</div>
        <div style={{ marginBottom: '6px' }}>
          <strong>"The pie charts compare</strong>... <em>(what, who, when, where).</em>
        </div>
        <div style={{ marginBottom: '14px' }}>
          "It can be clearly seen that ... <em>(describe the most noticeable feature).</em>"
        </div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>Vocabulary</div>
        <div style={{ marginBottom: '10px' }}>
          When describing a pie chart, write about the <strong>highest</strong> (significant, lowest) percentage, the
          <strong> majority</strong> (minority), the <strong>greatest</strong> (smallest) proportion, the lowest number, the
          <strong> most</strong> (least) popular (common) item, etc.
        </div>
        <div style={{ marginBottom: '14px' }}>
          If there is a slice representing 25%, you could write <strong>"a quarter"</strong>, 50% - <strong>"a half"</strong>, 75% - <strong>"three quarters"</strong>.
        </div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>How to describe and compare pie charts</div>
        <div style={{ marginBottom: '10px' }}>
          Describe and compare the slices one by one. Make sure to mention the biggest and smallest.
        </div>
        <div>
          If a certain slice is two or three times bigger than another, you could write <strong>"twice (three times) as many Xs were used as Ys"</strong>.
          Another idea is to write <strong>"X is much more (or considerably less) common than Y"</strong>.
        </div>
      </div>
    ),
    sampleAnswer: `The pie charts compare the quantities of books of various categories sold to customers belonging to different age groups and gender during 2001 by Famous Book Store.

It can be clearly seen that parenting books were the most popular and that the biggest proportion of books was sold to men between the ages of 25 and 50.

The two dominant categories, parenting (25%) and cooking (22%) are followed very closely by psychology, with only 4 percent less sales than cooking books. Sales of fantasy and gardening literature recorded much smaller figures, 11 and 13 percent respectively. Books on Technology or Investment were the two least popular categories, with only seven percent of sales being of books about Investment and 4 percent of books on Technology.

Most of the books were sold to women and men from 25 to 50 years old (23 and 28 percent respectively). Sales figures amongst women older than 50 or younger than 25 as well as among men over 50 were very similar, at 12 and 14 percent. Only 9 % of the books were purchased by men under 25.`,
    imagePaths: ['/ielts/task1-pie-chart.png']
  },
  {
    id: 5,
    title: 'Table',
    guidance: `Table

How to start
"The table compares... (what, who, when, where)."

"It can be clearly seen that ... (describe the most noticeable trend/feature)."

Vocabulary
The vocabulary is the same as for all previous graphs/charts. If a time period or date is not mentioned, assume the present.

How to select and group information
The table you receive usually has a lot of categories. It is presented to you that way intentionally, to make describing all the categories in 20 minutes impossible.

When you analyze a table, go row by row (or column by column) and look for the highest or the lowest numbers. It will help you find the categories you can contrast (by describing the differences between them).

If similar numbers appear in rows/columns – that’s an opportunity for you to compare them (by describing the similarities between them).

You must learn to group information and describe groups of categories rather than just discarding the information. You can do this by noticing similar trends and grouping them together.`,
    guidanceForScreen: (
      <div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>Table</div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>How to start</div>
        <div style={{ marginBottom: '6px' }}>
          <strong>"The table compares</strong>... <em>(what, who, when, where).</em>
        </div>
        <div style={{ marginBottom: '14px' }}>
          "It can be clearly seen that ... <em>(describe the most noticeable trend/feature).</em>"
        </div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>Vocabulary</div>
        <div style={{ marginBottom: '14px' }}>
          The vocabulary is the same as for all previous graphs/charts. If a time period or date is not mentioned, assume the present.
        </div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>How to select and group information</div>
        <div style={{ marginBottom: '10px' }}>
          The table you receive usually has a lot of categories. It is presented to you that way intentionally, to make describing all the categories in 20 minutes impossible.
        </div>
        <div style={{ marginBottom: '10px' }}>
          When you analyze a table, go row by row (or column by column) and look for the highest or the lowest numbers. It will help you find the categories you can contrast (by describing the differences between them).
        </div>
        <div style={{ marginBottom: '10px' }}>
          If similar numbers appear in rows/columns – that’s an opportunity for you to compare them (by describing the similarities between them).
        </div>
        <div>
          You must learn to group information and describe groups of categories rather than just discarding the information. You can do this by noticing similar trends and grouping them together.
        </div>
      </div>
    ),
    sampleAnswer: `The table shows the number of people in five age groups who became victims of various crimes in Venezuela in 1999, including the total number of victims of every crime.

It can be clearly seen that robbery was the most common type of offence across all of the age groups.

The largest numbers of citizens were victims of either robbery or kidnapping, with over 4500 and 56 cases respectively for people between 15 and 24 years old. The numbers decline to 3312 and 48 respectively as we move to age group 25 to 44 and drop even further for ages 45 - 64, to 1067 cases of robbery and 16 kidnappings.

Figures for blackmail and murder victims show a different trend, they increase as we move from the 0-14 to the 25-44 age group, where they peak at 89 and 72 respectively before declining to 76 and 38 respectively in the 45-64 year-old cohort and to significantly smaller numbers of 8 and 13 among 65+ year-olds.

Negligence followed its own pattern of starting high at 39 for 0-14 year olds, then progressively dropping until it reached 0 in the 25-44 age group before climbing back up to 9 for the 65+ year olds.`,
    imagePaths: ['/ielts/task1-table.png']
  },
  {
    id: 6,
    title: 'Process',
    guidance: `Process

How to start
"The flow chart/diagram describes/reveals/shows the process of / procedure for ..."

"It is clear that the process/procedure has X stages/steps starting with ... and ending with ...."

Vocabulary
When describing a process, explain the sequence of stages/actions and use words like: firstly (secondly, thirdly), to begin with, then, after that, in addition, otherwise, at the same time (concurrently, simultaneously), finally.

How to describe a process
Describe every stage of the process one by one, connect the stages by using linking words from the Vocabulary section (firstly, then, finally, etc), and mention whether or not there are stages that are being performed at the same time. You should also talk about alternative stages, if there are any (when either stage A or B is performed). The main task here is to describe, not compare or contrast. Use present simple passive ("the letter is written" or "the research is conducted").`,
    guidanceForScreen: (
      <div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>Process</div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>How to start</div>
        <div style={{ marginBottom: '6px' }}>
          <strong>"The flow chart/diagram describes/reveals/shows</strong> the process of / procedure for ..."
        </div>
        <div style={{ marginBottom: '14px' }}>
          "It is clear that the process/procedure has X stages/steps starting with ... and ending with ...."
        </div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>Vocabulary</div>
        <div style={{ marginBottom: '14px' }}>
          When describing a process, explain the sequence of stages/actions and use words like: <strong>firstly</strong> (secondly, thirdly),
          <strong> to begin with</strong>, then, after that, in addition, otherwise, at the same time (concurrently, simultaneously), finally.
        </div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>How to describe a process</div>
        <div>
          Describe every stage of the process one by one, connect the stages by using linking words from the Vocabulary section
          (firstly, then, finally, etc), and mention whether or not there are stages that are being performed at the same time.
          You should also talk about alternative stages, if there are any (when either stage A or B is performed). The main task here
          is to describe, not compare or contrast. Use <strong>present simple passive</strong> ("the letter is written" or "the research is conducted").
        </div>
      </div>
    ),
    sampleAnswer: `The flow chart shows the detailed process of making a purchase online.

It is clear that there are 6 steps to the process, which involve actions of the customer, the merchant and the Credit Company.

First, the online order is placed together with the credit card information to enable the required funds to be withdrawn. Then a request to check the validity of the credit card (by verifying that the customer is its real owner) and availability of funds is received by the Credit Company. As a result, the credit card is either approved or declined by the company.

If the credit card is approved, the customer's order is fulfilled by the merchant. After that, the purchase amount is requested by the merchant from the Credit Company and finally, money is received by the merchant.

Alternatively, in cases when the credit card is denied by the Credit Company, a notification is sent to the merchant advising them not to supply the goods. Next, the order is declined by the merchant and after that a notification is sent to the customer.`,
    imagePaths: ['/ielts/task1-process1.png', '/ielts/task1-process2.png']
  },
  {
    id: 7,
    title: 'Plan / Map',
    guidance: `Plan / map

How to start
"The map / plan / diagram describes / shows / indicates / illustrates ... (what/where/when)."

"It is clear / evident that ... (describe the most noticeable feature or change)."

Vocabulary
When comparing maps, use words such as north (to the north of.../ on the northerly side) / south / east / west to describe locations of places. Remember to mention distances (a long distance from / near / in the same area). Look at the maps and try to find which facilities and buildings have been replaced / relocated / built / constructed / demolished / knocked down / reduced or enlarged in size / extended.

When comparing plans (of buildings, sites, etc) you can describe positions of places using words such as next to / in front of / at the back of / across (the hall) / down the corridor / upstairs / above / downstairs / opposite / on the ground / first / second floor. It is easier to describe where something is located in relation to a starting point: "to the left of the entrance / directly opposite the lobby / across the hall from the lift".

How to compare plans / maps
In the introduction paragraph you should rephrase the task statement using synonyms.

In the overview write a sentence or two summarizing the most noticeable changes.

In the body paragraphs you should describe the changes that already occurred (if one map describes the past and the other – the present) or the changes that will occur (if one map describes the present and the other – the future). It may be necessary to mention the initial locations of buildings / trees / structures / rooms / facilities first, in order to explain later how they have changed or will change.`,
    guidanceForScreen: (
      <div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px' }}>Plan / map</div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>How to start</div>
        <div style={{ marginBottom: '6px' }}>
          <strong>"The map / plan / diagram describes / shows / indicates / illustrates</strong> ... <em>(what/where/when).</em>
        </div>
        <div style={{ marginBottom: '14px' }}>
          "It is clear / evident that ... <em>(describe the most noticeable feature or change).</em>"
        </div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>Vocabulary</div>
        <div style={{ marginBottom: '10px' }}>
          When comparing maps, use words such as <strong>north</strong> (to the north of.../ on the northerly side) / south / east / west to describe locations of places.
          Remember to mention distances (a long distance from / near / in the same area).
        </div>
        <div style={{ marginBottom: '10px' }}>
          Look at the maps and try to find which facilities and buildings have been <strong>replaced / relocated / built / constructed / demolished / knocked down / reduced or enlarged in size / extended</strong>.
        </div>
        <div style={{ marginBottom: '10px' }}>
          When comparing plans (of buildings, sites, etc) you can describe positions of places using words such as <strong>next to / in front of / at the back of / across (the hall) / down the corridor / upstairs / above / downstairs / opposite / on the ground / first / second floor</strong>.
          It is easier to describe where something is located in relation to a starting point: <strong>"to the left of the entrance / directly opposite the lobby / across the hall from the lift"</strong>.
        </div>

        <div style={{ fontWeight: 700, textDecoration: 'underline', marginBottom: '8px' }}>How to compare plans / maps</div>
        <div style={{ marginBottom: '10px' }}>
          In the introduction paragraph you should rephrase the task statement using synonyms.
        </div>
        <div style={{ marginBottom: '10px' }}>
          In the overview write a sentence or two summarizing the most noticeable changes.
        </div>
        <div>
          In the body paragraphs you should describe the changes that already occurred (if one map describes the past and the other – the present) or the changes that will occur (if one map describes the present and the other – the future).
          It may be necessary to mention the initial locations of buildings / trees / structures / rooms / facilities first, in order to explain later how they have changed or will change.
        </div>
      </div>
    ),
    sampleAnswer: `The map illustrates the transformation of Lakeside Holiday Village as a result of redevelopment in 2014.

It is clear that after the redevelopment more guests can stay at the resort and their holiday activities became more varied.

The map shows that three new cabins had been constructed in 2014 to the east of the previously existing six cabins along the beach. Children can play at a new playground that had been built on the east side of the park. A new picnic area to the south of Aquarius Drive had been added for village guests to relax in after some walking along the nature trails.

A pier had been constructed to the east of the swimming area, between the two groups of cabins, old and new. This facilitates boating and fishing in Mirror Lake. The old laundry building that was located between two car parks had been demolished and replaced with a new laundry in a more discreet location, behind Cabins #1 and #2.`,
    imagePaths: ['/ielts/task1-plan-map1.png', '/ielts/task1-plan-map2.png']
  }
];

type SelectedPrompt = {
  type: 'Task 1' | 'Task 2';
  id: number;
  prompt?: string;
};

export const task2Prompts: WritingPrompt[] = [
  {
    id: 1,
    prompt:
      'Topic 1 (Hint: Argument)\nYou should spend about 40 minutes on this task.\n\nSome people believe that excessive use of modern technologies, such as computers and smartphones, is negatively affecting the reading and writing skills of our young people. To what extent do you agree or disagree?\n\nYou should write at least 250 words.'
  },
  {
    id: 2,
    prompt:
      'Topic 2 (Hint: Argument)\nYou should spend about 40 minutes on this task.\n\nSome people say that the education system is the only critical factor in the development of a country. Do you agree or disagree with this statement?\n\nYou should write at least 250 words.'
  },
  {
    id: 3,
    prompt:
      'Topic 3 (Hint: Point of view)\nYou should spend about 40 minutes on this task.\n\nDieting can change a person\'s life for the better or ruin one\'s health completely. What is your opinion?\n\nYou should write at least 250 words.'
  },
  {
    id: 4,
    prompt:
      'Topic 4 (Hint: Argument)\nYou should spend about 40 minutes on this task.\n\nEducation in financial management should be a mandatory component of the school program. To what extent do you agree or disagree with this statement?\n\nYou should write at least 250 words.'
  },
  {
    id: 5,
    prompt:
      'Topic 5 (Hint: Argument)\nYou should spend about 40 minutes on this task.\n\nThe best way to reduce the number of traffic accidents is to raise the age limit for younger drivers and to lower the age limit for elderly ones. Do you agree or disagree?\n\nYou should write at least 250 words.'
  },
  {
    id: 6,
    prompt:
      'Topic 6 (Hint: Situation)\nYou should spend about 40 minutes on this task.\n\nObesity was once considered a disease of adults; however, it is becoming increasingly common among children. Why do you think this is happening? What can be done to help children stay healthy?\n\nYou should write at least 250 words.'
  },
  {
    id: 7,
    prompt:
      'Topic 7 (Hint: Point of view)\nYou should spend about 40 minutes on this task.\n\nSome people today believe that it is acceptable to use physical force to discipline children, but others feel it is completely unacceptable. Discuss both views and give your opinion.\n\nYou should write at least 250 words.'
  },
  {
    id: 8,
    prompt:
      'Topic 8 (Hint: Situation)\nYou should spend about 40 minutes on this task.\n\nNowadays children are spending much more time watching TV compared to the past. Why do you think this happens? Is this a positive or a negative change?\n\nYou should write at least 250 words.'
  },
  {
    id: 9,
    prompt:
      'Topic 9 (Hint: Point of view)\nYou should spend about 40 minutes on this task.\n\nSome people believe that the government should take care of older people and provide financial support after they retire. Others say individuals should save during their working years to fund their own retirement. What is your opinion?\n\nYou should write at least 250 words.'
  }
];

export const sampleAnswers: Record<string, string> = {
  'task2-1': '모범 답안이 아직 작성되지 않았습니다.',
  'task2-2': '모범 답안이 아직 작성되지 않았습니다.'
};

interface IELTSWritingProps {
  onBack: () => void;
}

const IELTSWriting: React.FC<IELTSWritingProps> = ({ onBack }) => {
  const [currentSection, setCurrentSection] = useState<WritingSection>('task1');
  const [selectedTask1Id, setSelectedTask1Id] = useState<number>(task1Topics[0].id);
  const [selectedTask2Id, setSelectedTask2Id] = useState<number>(task2Prompts[0].id);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [rawGeminiResponse, setRawGeminiResponse] = useState<string>('');
  const [rawGeminiPrompt, setRawGeminiPrompt] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [showSampleAnswer, setShowSampleAnswer] = useState<boolean>(false);
  const [task1PracticeMode, setTask1PracticeMode] = useState<Record<number, 'sample' | 'practice1' | 'practice2'>>({
    1: 'sample',
    2: 'sample',
    3: 'sample',
    4: 'sample',
    5: 'sample',
    6: 'sample',
    7: 'sample'
  });

  const selectedPrompt: SelectedPrompt = useMemo(() => {
    if (currentSection === 'task1') {
      const topic = task1Topics.find((item) => item.id === selectedTask1Id) || task1Topics[0];
      return { type: 'Task 1', id: topic.id };
    }
    const prompt = task2Prompts.find((item) => item.id === selectedTask2Id) || task2Prompts[0];
    return { type: 'Task 2', id: prompt.id, prompt: prompt.prompt };
  }, [currentSection, selectedTask1Id, selectedTask2Id]);

  const wordCount = useMemo(() => {
    if (!userAnswer.trim()) return 0;
    return userAnswer.trim().split(/\s+/).length;
  }, [userAnswer]);

  const sampleAnswerKey = useMemo(() => {
    const id = currentSection === 'task1' ? selectedTask1Id : selectedTask2Id;
    return `${currentSection}-${id}`;
  }, [currentSection, selectedTask1Id, selectedTask2Id]);

  const sampleAnswer = useMemo(() => {
    if (currentSection === 'task1') {
      const topic = task1Topics.find((item) => item.id === selectedTask1Id) || task1Topics[0];
      return topic.sampleAnswer || sampleAnswers[sampleAnswerKey] || '';
    }
    return sampleAnswers[sampleAnswerKey] || '';
  }, [currentSection, selectedTask1Id, sampleAnswerKey]);

  const currentTask1Topic = useMemo(
    () => task1Topics.find((item) => item.id === selectedTask1Id) || task1Topics[0],
    [selectedTask1Id]
  );

  const currentPracticeMode = task1PracticeMode[selectedTask1Id] || 'sample';

  const effectiveImagePaths = useMemo(() => {
    if (currentSection === 'task1' && selectedTask1Id === 1) {
      if (currentPracticeMode === 'practice1') {
        return ['/ielts/task1-single-line-graph-practice1.png'];
      }
      if (currentPracticeMode === 'practice2') {
        return ['/ielts/task1-single-line-graph-practice2.png'];
      }
    }
    if (currentSection === 'task1' && selectedTask1Id === 2) {
      if (currentPracticeMode === 'practice1') {
        return ['/ielts/task1-double-line-graph-practice1.png'];
      }
      if (currentPracticeMode === 'practice2') {
        return ['/ielts/task1-double-line-graph-practice2.png'];
      }
    }
    if (currentSection === 'task1' && selectedTask1Id === 3) {
      if (currentPracticeMode === 'practice1') {
        return ['/ielts/task1-bar-graph-practice1.png'];
      }
      if (currentPracticeMode === 'practice2') {
        return ['/ielts/task1-bar-graph-practice2.png'];
      }
    }
    if (currentSection === 'task1' && selectedTask1Id === 4) {
      if (currentPracticeMode === 'practice1') {
        return ['/ielts/task1-pie-chart-practice1.png'];
      }
      if (currentPracticeMode === 'practice2') {
        return ['/ielts/task1-pie-chart-practice2.png'];
      }
    }
    if (currentSection === 'task1' && selectedTask1Id === 5) {
      if (currentPracticeMode === 'practice1') {
        return ['/ielts/task1-table-practice1.png'];
      }
      if (currentPracticeMode === 'practice2') {
        return ['/ielts/task1-table-practice2.png'];
      }
    }
    if (currentSection === 'task1' && selectedTask1Id === 6) {
      if (currentPracticeMode === 'practice1') {
        return ['/ielts/task1-process-practice1.png'];
      }
    }
    if (currentSection === 'task1' && selectedTask1Id === 7) {
      if (currentPracticeMode === 'practice1') {
        return ['/ielts/task1-plan-map-practice1.png'];
      }
    }
    return currentTask1Topic.imagePaths || [];
  }, [currentSection, selectedTask1Id, currentPracticeMode, currentTask1Topic.imagePaths]);

  const isPracticeMode =
    currentSection === 'task1' &&
    (selectedTask1Id === 1 || selectedTask1Id === 2 || selectedTask1Id === 3 || selectedTask1Id === 4 || selectedTask1Id === 5 || selectedTask1Id === 6 || selectedTask1Id === 7) &&
    currentPracticeMode !== 'sample';

  const calculateSimilarity = async () => {
    if (!userAnswer.trim()) return;

    setIsAnalyzing(true);
    setRawGeminiResponse('');
    setRawGeminiPrompt('');

    try {
      const task1Topic = task1Topics.find((item) => item.id === selectedTask1Id) || task1Topics[0];
      const guideText = currentSection === 'task1' ? (task1Topic.guidance || '') : '';
      const imagePayloads: Array<{ data: string; mimeType: string }> = [];

      if (currentSection === 'task1' && effectiveImagePaths.length) {
        try {
          for (const imagePath of effectiveImagePaths) {
            const response = await fetch(imagePath);
            const blob = await response.blob();
            const data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(String(reader.result || '').split(',')[1] || '');
              reader.onerror = () => reject(new Error('Failed to read image'));
              reader.readAsDataURL(blob);
            });
            if (data) {
              imagePayloads.push({ data, mimeType: blob.type || 'image/png' });
            }
          }
        } catch (error) {
          console.warn('Failed to load task image for Gemini:', error);
        }
      }

      const analysisQuestion = [
        `IELTS Academic Writing ${selectedPrompt.type}`,
        guideText ? `Guide:\n${guideText}` : '',
        currentSection === 'task1' && effectiveImagePaths.length
          ? `Task: Refer to the attached image. (${effectiveImagePaths.join(', ')})`
          : '',
        currentSection === 'task2' && selectedPrompt.prompt
          ? `Task: ${selectedPrompt.prompt}`
          : ''
      ].filter(Boolean).join('\n\n');

      const lambdaUrl = process.env.REACT_APP_LAMBDA_FUNCTION_URL;
      const effectiveSampleAnswer = sampleAnswer?.trim()
        ? sampleAnswer
        : '모범 답안이 아직 작성되지 않았습니다.';
      const requestPayload = {
        userAnswer,
        sampleAnswer: effectiveSampleAnswer,
        question: analysisQuestion,
        analysisType: 'ielts-writing' as const,
        images: imagePayloads.length ? imagePayloads : undefined
      };
      setRawGeminiPrompt(buildGeminiPrompt(requestPayload));
      const data = await analyzeWithGemini(requestPayload, lambdaUrl);

      if (data.success && data.analysis) {
        const rawText =
          data.rawText ||
          data.analysis?.text ||
          JSON.stringify(data.analysis, null, 2);
        setRawGeminiResponse(rawText || '');
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error analyzing with Gemini:', error);
      setRawGeminiResponse(JSON.stringify({ error: String(error) }, null, 2));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={onBack}
            className="back-button"
            style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            ← 뒤로 가기
          </button>
          <h1>✍️ IELTS Writing 연습</h1>
        </div>
      </header>

      <main className="App-main" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ background: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 5px 20px rgba(0, 0, 0, 0.1)', textAlign: 'left' }}>
          <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>📚 섹션 선택 (Section):</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
            <button
              onClick={() => {
                setCurrentSection('task1');
                setUserAnswer('');
                setRawGeminiResponse('');
                setRawGeminiPrompt('');
                setTask1PracticeMode((prev) => ({ ...prev, 1: 'sample', 2: 'sample', 3: 'sample', 4: 'sample', 5: 'sample', 6: 'sample', 7: 'sample' }));
                setShowSampleAnswer(false);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                background: currentSection === 'task1' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f2f2f2',
                color: currentSection === 'task1' ? 'white' : '#333'
              }}
            >
              Task 1
            </button>
            <button
              onClick={() => {
                setCurrentSection('task2');
                setUserAnswer('');
                setRawGeminiResponse('');
                setRawGeminiPrompt('');
                setTask1PracticeMode((prev) => ({ ...prev, 1: 'sample', 2: 'sample', 3: 'sample', 4: 'sample', 5: 'sample', 6: 'sample', 7: 'sample' }));
                setShowSampleAnswer(false);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                background: currentSection === 'task2' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f2f2f2',
                color: currentSection === 'task2' ? 'white' : '#333'
              }}
            >
              Task 2
            </button>
          </div>

          {currentSection === 'task1' ? (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>📝 주제 선택 :</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                {task1Topics.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedTask1Id(item.id);
                      setUserAnswer('');
                    setRawGeminiResponse('');
                    setRawGeminiPrompt('');
                    setTask1PracticeMode((prev) => ({ ...prev, [item.id]: 'sample' }));
                      setShowSampleAnswer(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      background: selectedTask1Id === item.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f2f2f2',
                      color: selectedTask1Id === item.id ? 'white' : '#333'
                    }}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>📝 주제 선택 :</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                {task2Prompts.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedTask2Id(item.id);
                      setUserAnswer('');
                    setRawGeminiResponse('');
                    setRawGeminiPrompt('');
                    setTask1PracticeMode((prev) => ({ ...prev, 1: 'sample', 2: 'sample', 3: 'sample', 4: 'sample', 5: 'sample', 6: 'sample', 7: 'sample' }));
                      setShowSampleAnswer(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      background: selectedTask2Id === item.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f2f2f2',
                      color: selectedTask2Id === item.id ? 'white' : '#333'
                    }}
                  >
                    {item.id === 1 ? 'Topic 1' : item.id === 2 ? 'Topic 2' : item.id === 3 ? 'Topic 3' : item.id === 4 ? 'Topic 4' : item.id === 5 ? 'Topic 5' : item.id === 6 ? 'Topic 6' : item.id === 7 ? 'Topic 7' : item.id === 8 ? 'Topic 8' : item.id === 9 ? 'Topic 9' : `Task 2 #${item.id}`}
                  </button>
                ))}
              </div>
            </>
          )}
          {selectedPrompt.prompt && (
            <>
              <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '18px', marginBottom: '12px', borderLeft: '4px solid #667eea', lineHeight: '1.7', color: '#333' }}>
                <h4 style={{ margin: '0 0 8px 0' }}>1. 에세이의 기본 구조 이해</h4>
                <p style={{ margin: '0 0 8px 0' }}>에세이는 반드시 서론, 본론, 결론의 구조를 갖춰야 합니다. 이는 점수에 직접적인 영향을 미칩니다.</p>
                <ul style={{ margin: '0 0 8px 18px' }}>
                  <li>서론: 보통 한 단락으로 구성합니다.</li>
                  <li>본론: 두 개 또는 세 개의 단락으로 구성합니다.</li>
                  <li>결론: 한 단락으로 마무리합니다.</li>
                </ul>

                <h4 style={{ margin: '0 0 8px 0' }}>2. 질문 유형 분류 (A, P, S 유형)</h4>
                <p style={{ margin: '0 0 8px 0' }}>작성을 시작하기 전, 질문이 어떤 유형인지 파악해야 합니다. 유형에 따라 계획이 달라집니다.</p>
                <ul style={{ margin: '0 0 8px 18px' }}>
                  <li>A (Argument - 논쟁): 하나의 주장을 제시하고 찬반, 장단점을 탐구합니다. 보통 한쪽 편만 지지합니다.</li>
                  <li>P (Point of view - 관점): 두 가지 상반된 관점(또는 하나)을 제시하고 이를 논의한 뒤 자신의 의견을 밝힙니다.</li>
                  <li>S (Situation - 상황): 특정 상황의 원인을 분석하고, 미래를 예측하거나 해결책을 제안합니다.</li>
                </ul>

                <h4 style={{ margin: '0 0 8px 0' }}>3. 에세이 작성 3단계 (Baby Steps)</h4>
                <p style={{ margin: '0 0 8px 0' }}><strong>[1단계] 질문 읽고 분류하기</strong><br />문제의 핵심을 파악하여 A, P, S 중 어떤 유형인지 결정합니다. 이 단계가 에세이 전체의 방향을 결정합니다.</p>
                <p style={{ margin: '0 0 8px 0' }}><strong>[2단계] 아이디어 구상 및 브레인스토밍</strong></p>
                <ul style={{ margin: '0 0 8px 18px' }}>
                  <li>A 유형: 찬성 측과 반대 측 아이디어를 모두 생각합니다.</li>
                  <li>P 유형: 제시된 각 관점에 대한 아이디어를 생각합니다.</li>
                  <li>S 유형: 상황의 원인, 결과, 개선 방안을 구상합니다.</li>
                </ul>
                <p style={{ margin: '0 0 8px 0' }}><strong>정리:</strong> 생각나는 모든 아이디어를 적은 뒤, 어떤 아이디어를 본론 몇 번째 단락에 넣을지 그룹화합니다. 중요: 내가 동의하지 않는 쪽을 먼저 배치하고, 내가 동의하는 쪽을 나중에 배치하여 자연스럽게 결론으로 연결되도록 합니다.</p>
                <p style={{ margin: '0 0 8px 0' }}><strong>[3단계] 본격적인 작성</strong></p>
                <p style={{ margin: '0 0 6px 0' }}><strong>서론 작성:</strong> 문제를 그대로 베끼지 말고, 자신만의 단어로 바꾸어(Rephrasing) 주제를 소개합니다. 서론에서 바로 자신의 의견을 내기보다는 본론을 위해 아껴둡니다.</p>
                <p style={{ margin: '0 0 6px 0' }}><strong>본론 작성:</strong></p>
                <ul style={{ margin: '0 0 8px 18px' }}>
                  <li>최소 2개 단락을 작성하며, 각 단락은 하나의 핵심 아이디어를 담아야 합니다.</li>
                  <li>객관적으로 작성해야 하며, 개인적인 경험보다는 일반적인 사회 현상이나 사실 위주로 설명합니다.</li>
                  <li>단락을 시작할 때 연결어(However, Therefore 등)를 사용하여 논리적 흐름을 만듭니다.</li>
                </ul>
                <p style={{ margin: '0 0 12px 0' }}><strong>결론 작성:</strong> 본문에서 언급한 내용을 요약합니다. 결론이 짧아지더라도 전체적인 에세이 구조를 유지하는 것이 중요합니다.</p>

                <h4 style={{ margin: '0 0 8px 0' }}>4. 최종 점검 및 팁</h4>
                <ul style={{ margin: '0 0 12px 18px' }}>
                  <li>시간 관리: 40분 안에 250자 이상을 쓰는 것을 목표로 합니다. 처음에는 시간이 오래 걸리더라도 연습을 통해 시간을 단축해야 합니다.</li>
                  <li>객관성 유지: 질문에서 직접적으로 묻지 않는 한, 개인적인 경험보다는 사회 전반의 시각에서 객관적으로 서술합니다.</li>
                  <li>검토: 작성을 마친 후에는 반드시 처음부터 끝까지 다시 읽으며 문법이나 논리적 오류가 없는지 확인합니다.</li>
                  <li>취약 주제 연습: 자신이 좋아하지 않거나 잘 모르는 주제를 골라 연습해 보세요. 이는 실제 시험에서 어떤 주제가 나와도 당황하지 않고 배경 지식과 어휘를 활용할 수 있게 해줍니다.</li>
                </ul>

                <h4 style={{ margin: '0 0 8px 0' }}>Helpful phrases</h4>
                <p style={{ margin: '0 0 10px 0' }}>매일 영어를 읽고 쓰지 않는 사람들은 에세이에서 자신을 표현하는 데 어려움을 겪곤 합니다. 그래서 더 우아한 문장을 쓰는 데 도움이 되는 문구 목록을 아래에 첨부합니다.</p>

                <p style={{ margin: '0 0 6px 0' }}><strong>Phrases to show two sides of an argument (주장의 양면을 보여주는 문구)</strong></p>
                <ul style={{ margin: '0 0 10px 18px' }}>
                  <li>"Some people prefer... Those who disagree point out that..." (어떤 이들은 ...을 선호한다... 반대하는 이들은 ...라고 지적한다)</li>
                  <li>"We must acknowledge... Nevertheless, ..." (우리는 ...을 인정해야 한다... 그럼에도 불구하고, ...)</li>
                  <li>"No one can deny... However, ..." (아무도 ...을 부정할 수 없다... 하지만, ...)</li>
                  <li>"Many people hold the opinion... Others, however, disagree..." (많은 이들이 ...라는 의견을 가지고 있다... 하지만 다른 이들은 이에 동의하지 않는다...)</li>
                  <li>"Although it is hard to compete with..., some people still prefer ..." (...와 경쟁하기 어렵지만, 일부 사람들은 여전히 ...을 선호한다)</li>
                </ul>

                <p style={{ margin: '0 0 6px 0' }}><strong>Phrases for adding a linked point (관련 내용을 덧붙이는 문구)</strong></p>
                <ul style={{ margin: '0 0 10px 18px' }}>
                  <li>"Not only..., but also..." (...뿐만 아니라 ...도)</li>
                  <li>"Also" (또한)</li>
                  <li>"Furthermore," (게다가)</li>
                  <li>"In addition," (덧붙여서)</li>
                  <li>"Moreover," (더욱이)</li>
                </ul>

                <p style={{ margin: '0 0 6px 0' }}><strong>Phrases to contrast with what was written before (앞선 내용과 대조하는 문구)</strong></p>
                <ul style={{ margin: '0 0 10px 18px' }}>
                  <li>"Although..." (...임에도 불구하고)</li>
                  <li>"However," (하지만)</li>
                  <li>"Nevertheless," (그럼에도 불구하고)</li>
                  <li>"Even if..." (...일지라도)</li>
                  <li>"In spite of" (...에도 불구하고)</li>
                  <li>"On the other hand," (반면에)</li>
                </ul>

                <p style={{ margin: '0 0 6px 0' }}><strong>Phrases for examples (예시를 들 때의 문구)</strong></p>
                <ul style={{ margin: '0 0 10px 18px' }}>
                  <li>"For example," (예를 들어)</li>
                  <li>"For instance," (예를 들어)</li>
                  <li>"In particular," (특히)</li>
                  <li>"..., such as" (...와 같은)</li>
                  <li>"To illustrate ..." (설명하자면 ...)</li>
                </ul>

                <p style={{ margin: '0 0 6px 0' }}><strong>Phrases for results (결과를 나타내는 문구)</strong></p>
                <ul style={{ margin: '0 0 10px 18px' }}>
                  <li>"As a result" (결과적으로)</li>
                  <li>"Therefore" (그러므로)</li>
                  <li>"Thus" (따라서)</li>
                  <li>"So" (그래서)</li>
                  <li>"Eventually" (결국)</li>
                </ul>
              </div>
              <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>📝 Topic</h3>
              <p style={{ marginTop: 0, lineHeight: '1.6', color: '#333', whiteSpace: 'pre-line' }}>
                {selectedPrompt.prompt}
              </p>
            </>
          )}
          {currentSection === 'task1' && (
            <div style={{ marginTop: '15px', background: '#f8f9fa', padding: '15px', borderRadius: '10px', borderLeft: '4px solid #667eea', textAlign: 'left' }}>
              <div style={{ lineHeight: '1.7', color: '#333' }}>
                {(task1Topics.find((item) => item.id === selectedTask1Id) || task1Topics[0]).guidanceForScreen || '가이드가 아직 준비되지 않았습니다.'}
              </div>
            </div>
          )}
        </div>

        {currentSection === 'task1' && effectiveImagePaths.length > 0 && (
          <div style={{ background: 'white', borderRadius: '15px', padding: '25px', marginTop: '20px', boxShadow: '0 5px 20px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>🖼️ Sample task</h3>
            {(selectedTask1Id === 1 || selectedTask1Id === 2 || selectedTask1Id === 3 || selectedTask1Id === 4 || selectedTask1Id === 5 || selectedTask1Id === 6 || selectedTask1Id === 7) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                <button
                  onClick={() => {
                    setTask1PracticeMode((prev) => ({ ...prev, [selectedTask1Id]: 'sample' }));
                    setShowSampleAnswer(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    background: currentPracticeMode === 'sample' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f2f2f2',
                    color: currentPracticeMode === 'sample' ? 'white' : '#333'
                  }}
                >
                  Sample task
                </button>
                <button
                  onClick={() => {
                    setTask1PracticeMode((prev) => ({ ...prev, [selectedTask1Id]: 'practice1' }));
                    setShowSampleAnswer(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    background: currentPracticeMode === 'practice1' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f2f2f2',
                    color: currentPracticeMode === 'practice1' ? 'white' : '#333'
                  }}
                >
                  Practice task 1
                </button>
                {selectedTask1Id !== 6 && selectedTask1Id !== 7 && (
                  <button
                    onClick={() => {
                      setTask1PracticeMode((prev) => ({ ...prev, [selectedTask1Id]: 'practice2' }));
                      setShowSampleAnswer(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      background: currentPracticeMode === 'practice2' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f2f2f2',
                      color: currentPracticeMode === 'practice2' ? 'white' : '#333'
                    }}
                  >
                    Practice task 2
                  </button>
                )}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {effectiveImagePaths.map((path: string, index: number) => (
                <img
                  key={`${path}-${index}`}
                  src={path}
                  alt={`Task ${index + 1}`}
                  style={{ width: '100%', borderRadius: '10px', border: '1px solid #e0e0e0' }}
                />
              ))}
            </div>
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '15px', padding: '25px', marginTop: '20px', boxShadow: '0 5px 20px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>✍️ Your Answer</h3>
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="여기에 답안을 작성하세요..."
            style={{
              width: '100%',
              minHeight: '220px',
              padding: '15px',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#666' }}>단어 수: {wordCount}</span>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  if (isPracticeMode) {
                    return;
                  }
                  setShowSampleAnswer((prev) => !prev);
                }}
                disabled={isPracticeMode}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: isPracticeMode ? 'not-allowed' : 'pointer',
                  background: isPracticeMode ? '#e0e0e0' : '#eef2ff',
                  fontWeight: 600,
                  opacity: isPracticeMode ? 0.6 : 1
                }}
              >
                {showSampleAnswer ? '모범 답안 숨기기' : '모범 답안 보기'}
              </button>
              <button
                onClick={calculateSimilarity}
                disabled={isAnalyzing || !userAnswer.trim()}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: isAnalyzing || !userAnswer.trim() ? 'not-allowed' : 'pointer',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 600,
                  opacity: isAnalyzing || !userAnswer.trim() ? 0.6 : 1
                }}
              >
                {isAnalyzing ? '🤖 AI 분석 중...' : '📊 AI 분석하기'}
              </button>
              <button
                onClick={() => {
                  setUserAnswer('');
                  setRawGeminiResponse('');
                  setRawGeminiPrompt('');
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  background: '#f0f0f0',
                  fontWeight: 600
                }}
              >
                초기화
              </button>
            </div>
          </div>
        </div>

        {showSampleAnswer && (
          <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '20px', marginTop: '15px', borderLeft: '4px solid #28a745' }}>
            <h4 style={{ marginTop: 0 }}>📖 모범 답안</h4>
            <p style={{ margin: 0, lineHeight: '1.7', whiteSpace: 'pre-line', color: '#333' }}>
              {sampleAnswer || '모범 답안이 아직 작성되지 않았습니다.'}
            </p>
          </div>
        )}

        {rawGeminiPrompt && (
          <details style={{ background: '#0b1220', color: '#e6e6e6', borderRadius: '10px', padding: '15px', marginTop: '15px', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', color: '#fff', fontWeight: 600 }}>📨 Gemini Raw Prompt</summary>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.9rem' }}>
              {rawGeminiPrompt}
            </pre>
          </details>
        )}

        {rawGeminiResponse && (
          <div style={{ background: '#111', color: '#e6e6e6', borderRadius: '10px', padding: '15px', marginTop: '15px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#fff' }}>🧾 Gemini Raw Response</h4>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.9rem' }}>
              {rawGeminiResponse}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
};

export default IELTSWriting;
