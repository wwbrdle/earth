import React, { useState } from 'react';
import './TEFCanada.css';
import SpeechRecognition from './SpeechRecognition';
import ResultDisplay from './ResultDisplay';
import { analyzeWithGemini } from '../utils/geminiApi';

interface TEFCanadaProps {
  onBack: () => void;
}

// TEF Canada 모범 답안 데이터
const sampleAnswers: Record<string, Record<number, string>> = {
  sectionA: {
    1: `
    1️⃣ 파리 체류(여행) 문의
	1.	Bonjour, je vous appelle pour le séjour à Paris.
	2.	Quelles sont les dates disponibles ?
	3.	Combien de jours dure le séjour ?
	4.	Est-ce que l’hébergement est inclus ?
	5.	Où se situe l’hôtel ?
	6.	Le petit déjeuner est-il compris ?
	7.	Y a-t-il des visites organisées ?
	8.	Quel est le prix total du séjour ?
	9.	Est-ce possible de venir seul(e) ?
	10.	Comment peut-on réserver ?
    `,
    2: `
    2️⃣ 반려동물 돌봄(펫시터)
	1.	Bonjour, je vous appelle pour l’annonce de garde d’animaux.
	2.	Quels types d’animaux faut-il garder ?
	3.	Combien de temps dure la garde ?
	4.	Est-ce chez le propriétaire ou chez le gardien ?
	5.	À quelles dates avez-vous besoin de quelqu’un ?
	6.	Y a-t-il une rémunération ?
	7.	Faut-il de l’expérience avec les animaux ?
	8.	Est-ce tous les jours ou seulement certains jours ?
	9.	Où habitez-vous ?
	10.	Quand pouvons-nous nous rencontrer ?
    `,
    3: `
    3️⃣ 구직 관련 전화 문의 (일반)
	1.	Bonjour, je téléphone pour l’offre d’emploi.
	2.	Quel est le poste exactement ?
	3.	Quelles sont les tâches principales ?
	4.	Est-ce un travail à temps plein ou à temps partiel ?
	5.	Quels sont les horaires ?
	6.	Où se situe le lieu de travail ?
	7.	Quel est le salaire proposé ?
	8.	Faut-il une expérience particulière ?
	9.	Quand commence le travail ?
	10.	Comment peut-on postuler ?
    `,
    4: `
    4️⃣ 휴가 센터 문의
	1.	Bonjour, je vous appelle pour le centre de vacances.
	2.	À qui s’adresse ce centre ?
	3.	Quelles activités sont proposées ?
	4.	Est-ce adapté aux enfants ?
	5.	Combien de jours dure le séjour ?
	6.	Les repas sont-ils inclus ?
	7.	Où se trouve le centre ?
	8.	Quel est le prix ?
	9.	Y a-t-il des réductions ?
	10.	Comment s’inscrire ?
    `,
    5: `
    5️⃣ 사진 촬영(포트레이트)
	1.	Bonjour, je vous appelle pour un portrait photo.
	2.	Où se fait la séance photo ?
	3.	Combien de temps dure la séance ?
	4.	Combien de photos sont incluses ?
	5.	Est-ce possible de choisir le style ?
	6.	Quel est le prix ?
	7.	Les retouches sont-elles comprises ?
	8.	Faut-il prendre rendez-vous ?
	9.	Quand êtes-vous disponible ?
	10.	Comment puis-je réserver ?
    `,
    6: `
    6️⃣ 여가 활동 문의 (일반)
	1.	Bonjour, je téléphone pour votre offre de loisirs.
	2.	En quoi consiste exactement l’activité ?
	3.	À qui s’adresse cette activité ?
	4.	Quels sont les horaires ?
	5.	Où se déroule l’activité ?
	6.	Combien de personnes participent ?
	7.	Quel est le prix ?
	8.	Le matériel est-il fourni ?
	9.	Est-ce toute l’année ?
	10.	Comment s’inscrire ?
    `,
    7: `
    Bonjour, je vous téléphone pour l’annonce Recrut-Consso. Je suis intéressé(e) pour devenir testeur / testeuse de produits.

C’est quoi exactement le travail ? On teste quels types de produits ?
Est-ce que c’est seulement des produits alimentaires ou aussi d’autres choses (cosmétique, téléphone, vêtements…) ?
Il faut venir combien de fois par mois environ ?
Chaque séance dure combien de temps ?
Les séances sont le matin, l’après-midi ou le soir ?
C’est à quel endroit ? À Montréal ou dans une autre ville ?
Est-ce qu’on est payé à chaque fois qu’on vient ? Combien on gagne par séance ?
Il faut parler français tout le temps pendant les tests ?
Est-ce qu’il y a d’autres personnes en même temps que moi ? Combien de personnes par groupe ?
Quelles sont les conditions pour s’inscrire ? Il faut avoir quel âge minimum ?
Est-ce qu’il faut être disponible tous les jours ou seulement certains jours ?
Comment ça se passe si je ne peux pas venir à une séance ?

Bonus (pour montrer que tu parles un peu plus) :

Est-ce qu’on reçoit des cadeaux ou des produits gratuits en plus ?
Je dois m’inscrire comment exactement ? Par téléphone seulement ?

Petit conseil B1 :
Commence par : « Bonjour, je m’appelle … et je téléphone pour l’annonce Recrut-Consso. »
Ensuite pose les questions une par une, attends la réponse de l’examinateur, et dis merci ou « D’accord, je comprends » entre chaque question.
Bonne chance pour ton TEF Canada ! Tu vas y arriver ! 💪 😊
    `,
    8: `
    Voici une liste de 10 questions simples, naturelles et adaptées au niveau B1 du TEF Canada pour cet appel téléphonique (poste d'éducateur sportif au club AS Brive) :

Bonjour, je vous appelle pour l’offre d’emploi d’éducateur sportif. Est-ce que le poste est toujours disponible s’il vous plaît ?
Le contrat est à durée déterminée… vous pouvez me dire combien de mois ça dure environ ?
Est-ce que c’est pour les enfants, les adolescents ou aussi les adultes ?
Combien d’heures par semaine il faut travailler en général ?
Les entraînements sont le week-end aussi ou seulement en semaine ?
Il faut obligatoirement avoir le diplôme BPJEPS ou c’est possible avec d’autres diplômes ?
Est-ce que vous cherchez quelqu’un qui peut aussi arbitrer les matchs ?
Le salaire, c’est à l’heure ou au mois ? Et est-ce qu’il y a des primes possibles ?
Est-ce que je dois habiter à Brive ou c’est possible d’être un peu plus loin ?
Quelles sont les prochaines étapes si je suis intéressé(e) ? Il faut envoyer un CV par mail ou venir directement ?

Tu peux les dire dans cet ordre ou les mélanger un peu selon la conversation.
Elles restent polies, claires et correspondent bien au niveau B1 (phrases pas trop longues, vocabulaire courant).
Bonne chance pour ton TEF Canada ! 💪⚽
    `,
    9: `
    TEF Canada의 Section A(정보 요청하기) 유형이군요! B1 수준에서는 너무 복잡한 문법보다는 상황에 맞는 적절한 의문문을 사용하고, 자연스럽게 대화의 문을 여는 것이 중요합니다.

광고에 나온 정보를 바탕으로 질문 10개를 구성해 보았습니다.

📞 대화 시작하기 (Introduction)
"Bonjour, je vous appelle car j'ai vu votre annonce pour le centre de vacances à St Bauzille. Je voudrais avoir quelques renseignements supplémentaires, s'il vous plaît." (안녕하세요, St Bauzille 여름 캠프 광고를 보고 전화드렸습니다. 정보를 좀 더 얻고 싶어서요.)

❓ 10가지 질문 (Questions)
1. 일정 및 기간 관련
Est-ce que le centre est ouvert tout l'été ? (센터가 여름 내내 운영되나요?)

Quelles sont les dates exactes pour le mois de juillet ? (7월의 정확한 날짜가 어떻게 되나요?)

2. 활동 관련 (Activités)
Quelles activités proposez-vous aux enfants ? (아이들에게 어떤 활동들을 제공하나요?)

Est-ce qu'il y a des cours de natation à la plage ? (해변에서 수영 수업이 있나요?)

Y a-t-il des activités sportives en dehors de la plage ? (해변 활동 외에 다른 스포츠 활동도 있나요?)

3. 숙박 및 식사 관련 (Logement et Repas)
Comment sont organisées les chambres de 4 à 8 lits ? (4~8인실 침실은 어떻게 구성되어 있나요?)

Est-ce que les repas sont équilibrés pour les enfants ? (아이들을 위한 식사는 영양가 있게 나오나요?)

4. 안전 및 관리 관련
Combien d'animateurs s'occupent des enfants ? (아이들을 돌보는 인솔자 선생님은 몇 명인가요?)

Est-ce que le centre est sécurisé pendant la nuit ? (밤에도 센터 보안이 잘 유지되나요?)

5. 가격 및 예약 관련
Quel est le prix pour un séjour d'une semaine ? (일주일 머무는 비용은 얼마인가요?)

💡 B1 수준을 위한 팁
다양한 의문문 형태 사용: "Est-ce que~", "Combien~", "Quels~" 등을 골고루 섞어 쓰면 점수가 잘 나옵니다.

자연스러운 리액션: 면접관이 대답하면 "D'accord", "C'est noté(기록했습니다)", "C'est parfait" 같은 추임새를 넣어보세요.

마무리 인사: "Merci beaucoup pour ces informations. Je vais en discuter avec ma famille. Bonne journée !"

이 질문들 중에서 가장 입에 잘 붙는 문장들을 골라 연습해 보세요. 혹시 특정 부분에 대해 더 구체적인 문장이 필요하신가요?
    `,
    10: `
    이번 문제는 자녀를 위한 인물 사진(portrait) 무료 제공 광고네요. TEF Canada Section A의 B1 수준에 맞춰, 예의 바르면서도 정보 파악에 충실한 질문 10개를 준비했습니다.

📞 도입부 (Introduction)
"Bonjour, je vous appelle au sujet de votre offre spéciale pour un portrait photo d'enfant avec le photographe JOEL. Je suis très intéressé(e) et j'aimerais vous poser quelques questions." (안녕하세요, 사진작가 JOEL과 함께하는 자녀 인물 사진 특별 이벤트 광고를 보고 전화드렸습니다. 관심이 있어 몇 가지 여쭤보고 싶습니다.)

❓ 10가지 질문 (Questions)
1. 예약 및 시간 관련
Est-ce qu'il est nécessaire de prendre rendez-vous à l'avance ? (사전에 예약을 해야 하나요?)

Quels sont vos horaires d'ouverture entre le 15 et le 20 mars ? (3월 15일에서 20일 사이의 영업시간은 어떻게 되나요?)

Combien de temps dure la séance photo environ ? (촬영 시간은 대략 얼마나 걸리나요?)

2. 대상 및 조건 관련
Y a-t-il un âge maximum pour l'enfant ? (아이 나이 제한이 따로 있나요?)

Est-ce que l'offre est valable pour plusieurs enfants de la même famille ? (한 가족의 여러 아이에게도 이 혜택이 적용되나요?)

3. 촬영 및 결과물 관련
Peut-on choisir le décor ou le fond pour le portrait ? (인물 사진의 배경이나 장식을 선택할 수 있나요?)

Sous quel format recevons-nous la photo : numérique ou papier ? (사진은 어떤 형식으로 받게 되나요: 디지털 파일인가요, 인화된 종이인가요?)

Combien de photos sont offertes gratuitement ? (무료로 제공되는 사진은 몇 장인가요?)

4. 추가 비용 및 준비 관련
Est-ce qu'il y a des frais supplémentaires si je veux acheter d'autres photos ? (다른 사진들을 추가로 구매하고 싶다면 추가 비용이 있나요?)

Est-ce que nous devons apporter des vêtements spécifiques pour l'enfant ? (아이를 위해 특별한 옷을 준비해가야 하나요?)

💡 합격 팁 (B1 전략)
공손한 표현: 질문을 시작할 때 "Pourriez-vous me dire..." 또는 "Je voudrais savoir..."를 섞어주면 훨씬 부드럽습니다.

날짜 확인: 광고에 명시된 기간(Du 15 au 20 mars)을 언급하며 질문하는 것은 지문을 잘 이해했다는 좋은 신호입니다.

마무리: "Merci beaucoup pour vos réponses. C’est très clair. Je vais réfléchir et je vous rappelle pour confirmer le rendez-vous. Bonne journée !"

이 질문들 중에서 본인이 발음하기 가장 편한 문장들을 먼저 익혀보세요. 실제 시험처럼 저와 대화 연습을 해보고 싶으신가요?
    `,
    11: `
    이번에는 **"Parc Aventur’et vous !"**라는 레저 활동 광고를 보고 질문하는 상황이군요. **3시간의 어드벤처 활동(Accrobranche)**과 **카누 하강(Descente en Canoë)**이 포함된 **"Pass Duo Aventure"**에 대한 질문들을 B1 수준에 맞춰 준비했습니다.

📞 도입부 (Introduction)
"Bonjour, je vous appelle car j'ai vu votre offre 'Pass Duo Aventure' pour le parc Aventur’et vous. Je suis très intéressé par ces activités et j'aimerais avoir plus de détails, s'il vous plaît." (안녕하세요, 'Parc Aventur’et vous'의 'Pass Duo Aventure' 광고를 보고 전화드렸습니다. 활동에 관심이 많아 자세한 내용을 알고 싶습니다.)

❓ 10가지 질문 (Questions)
1. 예약 및 운영 관련
Est-ce qu'il faut réserver à l'avance pour le Pass Duo ? (듀오 패스를 위해 미리 예약해야 하나요?)

Quels sont les jours et les horaires d'ouverture du parc ? (공원 운영 요일과 시간은 어떻게 되나요?)

2. 활동 내용 및 조건 (Accrobranche & Canoë)
Pour l'accrobranche, est-ce qu'il y a différents niveaux de difficulté ? (아크로브랑슈(숲속 모험) 활동에 난이도가 여러 단계인가요?)

Quelle est la distance de la descente en canoë ? (카누 하강 코스 거리가 어떻게 되나요?)

Est-ce qu'un équipement spécial est fourni, comme un casque ou un gilet de sauvetage ? (헬멧이나 구명조끼 같은 특별 장비가 제공되나요?)

3. 대상 및 안전 관련
Y a-t-il un âge minimum ou une taille minimum pour participer ? (참여 가능한 최소 연령이나 신장 제한이 있나요?)

Est-ce que les activités sont encadrées par des moniteurs diplômés ? (자격증을 갖춘 강사님이 활동을 지도해 주시나요?)

4. 가격 및 복장 관련
Quel est le prix total pour le Pass Duo Aventure ? (듀오 어드벤처 패스의 총 가격은 얼마인가요?)

Y a-t-il des tarifs réduits pour les étudiants ou les groupes ? (학생이나 단체를 위한 할인 요금이 있나요?)

Quels vêtements me conseillez-vous de porter pour ces activités ? (이 활동들을 위해 어떤 옷을 입는 것이 좋을까요?)

💡 B1 시험 팁 (Strategy)
단어 활용: 광고에 명시된 "Accrobranche"(숲속 나무 사이를 이동하는 레저)와 **"Canoë"**라는 단어를 직접 활용하면 지문 이해도를 높게 평가받습니다.

Pass Duo의 의미: 'Duo'는 보통 2인용을 의미하므로, 가격을 물을 때 "C'est le prix pour deux personnes ? (2인 가격인가요?)"라고 확인 질문을 던지는 것도 아주 좋은 전략입니다.

자연스러운 대화: 질문만 던지기보다 면접관의 답변에 "D'accord, c'est parfait pour nous" (네, 저희에게 딱 좋네요)와 같은 반응을 섞어주세요.

이 질문들 중에서 본인이 가장 말하기 편한 문장들을 골라 연습해 보세요. 다음으로 다른 유형의 문제도 도와드릴까요?
    `,
  },
  sectionB: {
    1: `
    🔹 Exemple 1 : 퀘벡 여행 설득

Tu cherches une idée pour les vacances ? J’ai trouvé un circuit vraiment intéressant au Québec.
C’est un voyage de 8 jours et 7 nuits en pension complète, à partir de seulement 300 dollars, ce qui est très abordable.

Le séjour comprend l’hébergement dans des hôtels trois étoiles, les déplacements en autocar climatisé, ainsi que plusieurs visites et activités. Il y a aussi un guide francophone, donc c’est très rassurant et pratique.

Je pense que ce voyage serait parfait pour toi, car tu aimes découvrir de nouveaux paysages sans stress. Tout est organisé, on n’a rien à gérer. En plus, le Québec est une région magnifique, avec la nature, la culture et la gastronomie.

Franchement, à ce prix-là, on ne peut pas hésiter. Ce serait génial de partir ensemble !
    `,
    2: `
    🔹 Exemple 2 : 과외 교사 일자리 설득

J’ai vu une offre d’emploi qui pourrait vraiment t’intéresser.
Il s’agit de donner des cours à domicile avec l’organisme Dométudes.

Ils recherchent des personnes ayant fait des études universitaires, comme toi. Ce qui est intéressant, c’est la grande souplesse : tu choisis tes horaires et les matières que tu veux enseigner. La rémunération est bonne et tu peux travailler avec des enfants, des adolescents ou même des adultes.

C’est un excellent moyen de gagner de l’argent tout en partageant tes connaissances. En plus, c’est une expérience valorisante pour le CV.

Je pense sincèrement que ce travail te correspond très bien.
    `,
    3: `
    🔹 Exemple 3 : 봉사활동 설득 (S.O.S Amitié)

J’ai lu une annonce d’une association qui recherche des bénévoles dans le quartier.
Il s’agit de S.O.S Amitié, une association qui aide les personnes isolées.

Ils proposent une formation, des horaires flexibles et même la possibilité d’un contrat à durée déterminée. Le but est de créer du lien social et d’aider des personnes qui en ont besoin.

Je sais que tu as du temps libre et que tu aimes le contact humain. Ce bénévolat pourrait être très enrichissant sur le plan personnel. On se sent utile et on participe à quelque chose de positif.

Je pense que ce serait une très belle expérience pour toi.
    `,
    4: `
    🔹 Exemple 4 : 어학 수업 설득

J’ai trouvé une école de langues qui propose des cours très intéressants.
MEDIA Langues offre des cours en ligne pour toutes les langues, avec des horaires flexibles et des tarifs très avantageux.

Ils proposent plusieurs formules : une formule courte pour se débrouiller rapidement, une formule longue pour progresser en profondeur, ou une formule à la carte selon les besoins.

C’est idéal pour toi, car tu veux apprendre une langue sans contrainte de temps. En plus, les cours en ligne permettent d’apprendre de chez soi.

Honnêtement, c’est une très bonne opportunité pour progresser efficacement.
    `,
    5: `
    이번 문제는 **"Rendez-vous à la ferme (농장으로 오세요)"**라는 행사 광고입니다. 유기농 제품 시식, 농장 방문, 동물들과의 만남 등 아주 평화롭고 즐거운 활동들이 가득하네요. 친구에게 이번 주말 나들이를 제안하는 Section B 스크립트입니다.

🗣️ 대화 시작하기 (Introduction)
"Salut ! Tu n'as pas envie de quitter la ville un peu ce week-end ? J'ai vu une affiche pour un événement qui s'appelle 'Rendez-vous à la ferme'. Ça a l'air super pour se détendre et profiter de la nature. Ça te dit d'y aller avec moi ?" (안녕! 이번 주말에 도시를 좀 벗어나고 싶지 않아? '농장으로 오세요'라는 행사 포스터를 봤는데, 휴식하고 자연을 즐기기에 딱인 것 같아. 나랑 같이 갈래?)

💡 설득을 위한 주요 포인트 (Arguments)
1. 맛있는 먹거리와 유기농 체험
"On pourra goûter des produits bio directement à la ferme. C'est bien meilleur que ce qu'on achète au supermarché !" (농장에서 바로 만든 유기농 제품들을 시식할 수 있대. 마트에서 사는 것보다 훨씬 맛있을 거야!)

"Il y a un marché de producteurs sur place, on pourra acheter des produits frais pour la semaine." (현장에 생산자 마켓도 열려서, 일주일 동안 먹을 신선한 재료들도 살 수 있어.)

2. 동물들과의 만남 (정서적 휴식)
"On peut rencontrer les animaux de la ferme. C’est tellement relaxant de passer du temps avec eux !" (농장 동물들을 직접 만날 수 있대. 동물들이랑 시간 보내는 게 얼마나 힐링인데!)

3. 아이들과 함께하기 좋은 분위기
"Si tu veux, on peut emmener les enfants. Il y a des jeux et des ateliers spécialement pour eux." (원하면 애들도 데려가자. 애들을 위한 게임이랑 워크숍도 준비되어 있대.)

4. 실용적인 정보 (무료 및 시간)
"L'entrée est gratuite pour tout le monde, donc ça ne coûte rien !" (입장료가 모두에게 무료야. 돈도 안 들고 정말 좋지!)

"C'est ce dimanche de 10h à 18h. On peut y passer toute la journée." (이번 주 일요일 오전 10시부터 오후 6시까지야. 하루 종일 놀다 올 수 있어.)

📋 B1 합격 전략 (Section B)
핵심 키워드 활용: 광고에 나온 "Produits bio", "Gratuit", "Jeux et ateliers" 같은 단어들을 꼭 언급하세요.

거절 대응: 친구가 "멀 것 같아"라고 하면, "C’est juste à côté, à la ferme du coin"(우리 근처 농장이야)라고 하거나, "무료 입장인데 한번 가보자"라고 설득하세요.

행동 유도: "우리 일요일 아침에 같이 출발하자. 내가 9시에 데리러 갈까?"
    `,
    6: `
    마지막으로 올려주신 이미지는 요리 경연 프로그램인 **"La table des chefs (셰프들의 식탁)"**에 관한 광고입니다. 이 문제는 요리를 좋아하거나 새로운 도전을 꿈꾸는 친구에게 TV 프로그램 출연을 제안하며 설득하는 Section B 유형입니다.

🗣️ 대화 시작하기 (Introduction)
"Salut ! Dis-moi, tu n'as pas toujours rêvé de montrer tes talents de cuisinier à tout le monde ? J'ai vu une annonce pour une émission qui s'appelle 'La table des chefs'. C'est exactement ce qu'il te faut pour réaliser ton rêve ! Tu veux que je t'en dise plus ?" (안녕! 너 요리 실력을 사람들한테 보여주고 싶다는 꿈 꾸지 않았어? 'La table des chefs'라는 프로그램 광고를 봤는데, 네 꿈을 이루기에 딱이야! 더 자세히 말해줄까?)

💡 설득을 위한 주요 포인트 (Arguments)
1. 엄청난 우승 혜택 강조
"Le vainqueur gagne une somme incroyable de 10 000 € !" (우승자는 무려 1만 유로라는 엄청난 상금을 받는대!)

"En plus du prix, il y a une formation dans un grand restaurant à la clé. C'est une opportunité professionnelle unique." (상금뿐만 아니라 유명 레스토랑에서의 연수 기회도 준대. 정말 흔치 않은 직업적 기회야.)

2. 전문가의 평가와 대중적 인지도
"Tu seras jugé par un jury de professionnels et aussi par les téléspectateurs." (전문가 심사위원단이랑 시청자들한테 평가를 받게 될 거야.)

"C'est l'occasion de préparer tes meilleures recettes en direct à la télévision !" (네 최고의 레시피들을 TV 생방송에서 직접 만들 기회라니까!)

3. 쉬운 지원 방법
"C'est très simple pour s'inscrire, il suffit d'aller sur leur site internet : www.latabledeschefs-tv.com." (신청 방법도 아주 간단해. 그들 웹사이트에 들어가기만 하면 돼.)

📋 B1 합격 전략 (Section B)
자신감 북돋아 주기: 친구가 실력이 부족하다고 걱정하면 "너 저번에 만든 요리 정말 맛있었어"라며 광고에 나온 "Réalisez votre rêve"(꿈을 이루세요) 문구를 인용해 설득하세요.

구체적인 상금 언급: 10 000 € 라는 구체적인 숫자를 언급하면 지문 활용 능력을 인정받을 수 있습니다.

적극적인 제안: "Je suis sûr que tu vas gagner. On regarde les détails de l'inscription ensemble ?" (네가 이길 거라고 확신해. 우리 같이 신청 세부 사항 좀 볼까?)
    `,
    7: `
    마지막 이미지인 "우리 동물 친구들 (Nos amis les animaux)" 협회 봉사 활동에 대한 대답입니다. 이 문제는 동물을 좋아하거나 여가 시간을 보람차게 쓰고 싶어 하는 친구를 설득하는 Section B 유형입니다.

🗣️ 대화 시작하기 (Introduction)
"Salut ! Je sais que tu as pas mal de temps libre en ce moment et que tu adores les bêtes. J'ai trouvé une annonce pour l'association « Nos amis les animaux » qui cherche de l'aide pour s'occuper d'animaux abandonnés. Ça te dirait qu'on s'y inscrive ensemble ?"

💡 설득을 위한 주요 포인트 (Arguments)
1. 동물을 사랑하는 마음 실천
"Si tu aimes les bêtes, c'est l'occasion parfaite de les aider concrètement."

"Ces animaux sont seuls et ils cherchent de la compagnie, tu pourrais vraiment faire une différence pour eux."

2. 다양하고 즐거운 활동
"Ce n'est pas seulement du travail, il y a nombreuses activités très sympas."

"On peut faire des promenades avec eux, s'occuper du toilettage et des soins, et même faire des jeux !"

3. 정서적 혜택과 보람
"Passer du temps avec des animaux, c'est super pour réduire le stress."

"On va rencontrer d'autres bénévoles qui partagent la même passion que nous."

📋 B1 합격 전략 (Section B)
감성적 호소: "주인에게 버려진 불쌍한 강아지들이 너 같은 친구를 기다리고 있어"라며 친구의 공감대를 자극하세요.

구체적인 활동 언급: 광고에 명시된 Promenades(산책), Toilettage(미용/관리), **Jeux(놀이)**라는 단어를 직접 활용하여 구체성을 높이세요.

행동 유도: "우리 내일 같이 가서 상담 한번 받아볼까? 여기 번호도 있어: 03 23 67 32 32."
    `,
    8: `
    마지막 이미지인 "어둠 속의 식사 (Un dîner dans le noir)" 광고에 대한 대답입니다. 이 문제는 독특한 경험을 원하는 친구를 설득하여 함께 식사하러 가자고 제안하는 Section B 유형입니다. 시각을 차단한 채 미각에 집중하는 이색적인 컨셉을 강조했습니다.

🗣️ 대화 시작하기 (Introduction)
"Salut ! J’ai trouvé une idée de sortie vraiment originale pour nous deux. Ça s’appelle 'Un dîner dans le noir'. C'est un concept incroyable où on mange dans l'obscurité totale. Tu es partant pour tenter l'expérience ?" (안녕! 우리 둘을 위한 정말 독특한 외출 아이디어를 찾았어. '어둠 속의 식사'라는 건데, 완전히 어두운 곳에서 밥을 먹는 놀라운 컨셉이야. 같이 도전해 볼래?)

💡 설득을 위한 주요 포인트 (Arguments)
1. 오감을 자극하는 독특한 컨셉 강조
"Tu es plongé dans l'obscurité la plus totale, donc tu ne vois rien du tout !" (완벽한 어둠 속에 잠기게 되니까 아무것도 보이지 않을 거야!)

"C'est une expérience sensorielle unique : tu dégustes des plats dont tu ne connaîtras le nom qu'à la fin du repas." (일종의 감각 체험이야: 요리 이름을 식사가 다 끝날 때만 알 수 있거든. 정말 궁금하지 않아?)

2. 가성비 좋은 풀코스 메뉴
"Le menu est complet : il y a une dégustation, un plat et un dessert." (구성이 아주 알차: 시식 코스부터 메인 요리, 디저트까지 다 포함되어 있어.)

"C'est seulement 40 $ par personne, et les boissons sont comprises ! C'est une super affaire." (인당 40달러밖에 안 하는데 음료까지 포함이래! 정말 괜찮은 가격이지.)

3. 재미와 서스펜스
"L'annonce dit que nous n'êtes pas au bout de vos surprises. On va bien rigoler en essayant de deviner ce qu'on mange !" (광고에 놀라움이 끝이 없을 거라고 적혀 있어. 우리가 뭘 먹고 있는지 맞히려고 노력하다 보면 정말 재밌을 거야!)

📋 B1 합격 전략 (Section B)
이색적인 점 강조: 평범한 식당이 아니라는 점을 들어 "평생 잊지 못할 추억이 될 것"이라고 어필하세요.

거절 대응: 친구가 "음식이 맛없으면 어떡해?"라고 걱정하면, **"Dégustation"**과 "Surprises" 키워드를 써서 "맛을 맞히는 재미가 있고 전문적인 요리가 나올 것"이라고 안심시키세요.

행동 유도: "우리 '눈 감고 예약(Réservez les yeux fermés)' 해보자! 번호는 18 568 948이야. 내가 지금 전화해 볼까?"
    `,
    9: `
    이번 문제는 S.O.S Amitié라는 단체에서 **전화 상담 봉사자(Écoutants bénévoles)**를 모집하는 광고입니다. 이미 이전에 다뤘던 방문 봉사와는 달리, 이번에는 전화로 소외된 이들의 이야기를 들어주는 활동입니다. 친구에게 이 활동의 의미와 장점을 설명하며 설득하는 Section B 스크립트입니다.

🗣️ 대화 시작하기 (Introduction)
"Salut ! J’ai vu une annonce pour une association vraiment spéciale qui s’appelle S.O.S Amitié. Ils cherchent des écoutants bénévoles. Comme tu es quelqu'un de très attentif et que tu sais bien écouter les autres, j'ai pensé que ce serait parfait pour toi !" (안녕! 'S.O.S Amitié'라는 정말 특별한 단체의 광고를 봤어. '전화 상담 봉사자'를 찾고 있대. 너는 워낙 남의 말을 잘 들어주고 세심한 사람이니까, 이 일이 너한테 딱일 것 같아!)

💡 설득을 위한 주요 포인트 (Arguments)
1. 활동의 숭고한 의미 강조
"Cette association aide les personnes qui souffrent ou qui sont seules." (이 단체는 고통받거나 외로운 사람들을 도와주는 곳이야.)

"C'est une mission très importante pour apporter du réconfort à ceux qui en ont besoin." (도움이 필요한 사람들에게 위로를 전하는 정말 중요한 임무지.)

2. 전문적인 교육과 보장
"Ne t'inquiète pas si tu n'as pas d'expérience, une formation est assurée par l'association." (경험이 없어도 걱정 마, 단체에서 확실하게 교육을 해준대.)

"Toutes les écoutes se font de façon anonyme et confidentielle, ce qui protège aussi bien le bénévole que l'appelant." (모든 상담은 익명이며 비밀이 보장돼서, 봉사자와 발신자 모두를 보호해 줘.)

3. 유연한 참여 시간
"L'association fonctionne 24h/24 et 7j/7, donc tu peux choisir le créneau qui te convient le mieux selon ton emploi du temps." (24시간 연중무휴로 운영되니까, 네 스케줄에 맞춰서 가장 편한 시간을 고를 수 있어.)

📋 B1 합격 전략 (Section B)
친구의 성격과 연결하기: "너 저번에 친구 고민 상담해 줄 때 보니까 정말 잘하더라" 같은 칭찬을 섞으면 설득력이 높아집니다.

거절 대응: 친구가 "심리적으로 힘들 것 같아"라고 하면, "Formation assurée"(전문 교육)와 "Anonymat"(익명성)을 언급하며 전문가들이 뒤에서 지원해 준다는 점을 강조하세요.

연락처 안내: "관심 있으면 이 번호로 연락해 봐: 06 01 73 43 00 아니면 메일(sosamitie@gmail.com)을 보내봐도 좋아."
    `,
    10: `
    마지막 이미지인 "Le cirque Kinder (킨더 서커스)" 광고에 대한 대답입니다. 이 문제는 친구나 이웃에게 서커스 공연에 함께 가자고 설득하는 Section B 유형입니다. B1 수준에 맞춰 화려한 볼거리와 파격적인 할인 혜택을 강조하며 구성했습니다.

🗣️ 대화 시작하기 (Introduction)
"Salut ! Tu sais quoi ? Le cirque Kinder est en ville cette semaine ! J'ai vu l'affiche ce matin et ça a l'air incroyable. Tu es libre ce week-end pour y aller avec moi ?" (안녕! 그거 알아? 이번 주에 우리 동네에 '킨더 서커스'가 온대! 오늘 아침에 포스터를 봤는데 정말 재밌을 것 같아. 이번 주말에 나랑 같이 갈래?)

💡 설득을 위한 주요 포인트 (Arguments)
1. 다양한 볼거리와 프로그램 강조
"Au programme, il y a le plus grand groupe d'éléphants et de tigres ! C'est rare de voir ça." (프로그램 보니까 코끼리랑 호랑이가 엄청 많이 나온대! 이런 거 보기 힘들잖아.)

"Il y aura aussi des clowns, des magiciens et même des acrobates venus de Chine." (광대랑 마술사도 있고, 심지어 중국에서 온 곡예사들도 있대.)

"C'est un spectacle vraiment complet et impressionnant." (정말 구성이 알차고 인상적인 공연이 될 거야.)

2. 파격적인 가격 혜택 (1+1 행사)
"Le prix est très raisonnable, c'est seulement 20 euros la place." (가격도 정말 괜찮아, 한 장에 딱 20유로야.)

"En plus, pour les enfants, il y a une offre géniale : une place achetée = une place gratuite !" (게다가 아이들을 위한 대박 혜택이 있어: 티켓 한 장 사면 한 장은 공짜래!)

"C'est l'occasion parfaite pour sortir en famille sans dépenser trop." (돈 많이 안 쓰고 가족 나들이하기에 완벽한 기회지.)

3. 유연한 공연 시간
"On peut y aller ce week-end à 15h ou à 20h, donc c'est très pratique pour s'organiser." (이번 주말 오후 3시나 8시 중에 선택할 수 있어서 시간 맞추기도 아주 편해.)

📋 B1 합격 전략 (Section B)
숫자와 혜택 강조: "20유로"라는 가격과 "아이들 티켓 1+1" 혜택을 언급하며 경제적인 이점을 어필하세요.

호기심 자극: 중국 곡예사나 대규모 동물 공연처럼 광고에 나온 구체적인 특징을 언급해 친구의 관심을 끄세요.

행동 유도: "우리 늦기 전에 예약하자! 사이트 주소는 https://www.kindercirque.fr 이래. 내가 지금 바로 확인해 볼까?"

마무리 연습: 만약 친구가 "서커스는 애들이나 보는 거 아니야?"라고 한다면, "Acrobates et magiciens(곡예사와 마술사)" 같은 어른들도 좋아할 만한 요소를 강조하며 어떻게 다시 설득해 보시겠어요?
    `,
    11: `
    마지막 이미지인 "산악 낚시(La pêche en montagne)" 광고에 대한 대답입니다. 이 문제는 언어를 배우고 싶어 하거나 휴식이 필요한 친구에게 함께 낚시를 하러 가자고 설득하는 Section B 유형입니다. B1 수준에 맞춰 산의 정취와 가족 친화적인 분위기를 강조하며 구성했습니다.

🗣️ 대화 시작하기 (Introduction)
"Salut ! Tu m'as dit que tu avais besoin de te reposer et de sortir de la ville. J'ai trouvé une publicité géniale pour faire de la pêche en montagne avec une association. Ça te dirait d'y aller ensemble ce week-end ?" (안녕! 너 요즘 쉬고 싶고 도시를 벗어나고 싶다고 했잖아. 산에서 낚시를 즐길 수 있는 멋진 협회 광고를 찾았어. 이번 주말에 같이 가볼래?)

💡 설득을 위한 주요 포인트 (Arguments)
1. 실력에 상관없는 즐거움
"Que tu sois un pêcheur débutant ou un expert, tu vas t'amuser car c'est ouvert à tout le monde." (네가 초보든 전문가든 상관없이 모두에게 열려 있어서 즐겁게 즐길 수 있어.)

"C'est l'endroit idéal pour se ressourcer et se détendre dans la joie." (즐거운 마음으로 기운을 차리고 휴식하기에 정말 완벽한 장소야.)

2. 가족 및 친구와 함께하는 분위기
"L'ambiance est à la bonne humeur ! On peut même y aller avec des enfants, ils vont adorer !" (분위기가 정말 화기애애해! 아이들과 함께 가도 되는데, 아이들이 정말 좋아할 거래!)

"C'est une super occasion de passer du temps en plein air avec des amis." (친구들과 야외에서 시간을 보낼 수 있는 아주 좋은 기회야.)

3. 아름다운 자연환경
"Regarde les photos, les paysages de montagne sont magnifiques. Ça change vraiment du quotidien." (사진 좀 봐, 산 풍경이 정말 아름다워. 일상에서 확실히 벗어날 수 있을 거야.)

📋 B1 합격 전략 (Section B)
감성적 호소: "도시 소음에서 벗어나 자연의 소리를 들으면 정말 힐링 될 거야"라는 식으로 친구의 필요(휴식)에 맞춘 멘트를 추가하세요.

거절 대응: 친구가 "낚시 도구가 없어"라고 하면, "협회에 문의해서 빌릴 수 있는지 확인해 보자"라고 답하며 웹사이트 주소(www.associationpecheenmontagne.com)를 언급하세요.

행동 유도: "Allez, n'hésite pas ! On va bien s'amuser. Je regarde les horaires sur leur site ?" (에이, 망설이지 마! 진짜 재밌을 거야. 내가 사이트에서 시간표 한번 볼까?)

이제 요청하신 모든 이미지(총 13개)에 대한 분석과 모범 답안 정리가 끝났습니다!

전체적인 복습 팁:

Section A: 질문을 던질 때 "Est-ce que...", "Combien...", "Où..." 등 다양한 의문사를 사용했는지 확인하세요.

Section B: 광고에 나온 핵심 키워드를 최소 3~4개는 대화에 포함시켜야 높은 점수를 받습니다.

실제 시험에서 좋은 결과 있으시길 진심으로 응원합니다! 추가로 더 연습하고 싶은 부분이 있다면 언제든 말씀해 주세요. 조력자로서 함께하겠습니다.
    `,
    12: `
    마지막으로 올려주신 이미지는 고대 유적 발굴 현장(Chantiers de fouilles gallo-romains) 참여 광고네요. 언어를 배우고 싶어 하는 친구에게 역사도 배우고 프랑스 문화도 체험할 수 있는 이 특별한 기회를 제안하는 Section B 스크립트입니다.

🗣️ 대화 시작하기 (Introduction)
"Salut ! Je sais que tu t'intéresses beaucoup à l'histoire et que tu cherches un moyen original d'améliorer ton français. J'ai trouvé une annonce géniale : on peut participer à un chantier de fouilles gallo-romains cet été. Ça te dirait ?" (안녕! 네가 역사에 관심 많고 프랑스어를 늘릴 특별한 방법을 찾고 있다는 거 알아. 대박 광고를 하나 찾았는데, 이번 여름에 갈로-로만 유적 발굴 현장에 참여할 수 있대. 관심 있어?)

💡 설득을 위한 주요 포인트 (Arguments)
1. 지적 호기심 자극 (문화와 역사)
"C'est l'occasion rêvée d'en savoir plus sur les origines de la culture française." (프랑스 문화의 기원에 대해 더 자세히 배울 수 있는 꿈 같은 기회야.)

"Si tu aimes l'histoire ancienne, tu vas adorer ce projet !" (고대 역사를 좋아한다면 이 프로젝트가 정말 마음에 들 거야.)

2. 완벽한 혜택 (비용 부담 제로)
"Regarde, l'hébergement est gratuit ! On n'a pas à s'inquiéter pour le logement." (이것 좀 봐, 숙박이 무료야! 머물 곳 걱정은 안 해도 돼.)

"L'ambiance est décrite comme décontractée, donc ce ne sarà pas trop stressant." (분위기도 아주 편안하다고 하니까 너무 스트레스받지 않고 즐길 수 있을 거야.)

3. 유연한 일정
"On peut choisir de rester seulement une semaine 또는 여름 내내 참여할 수도 있어. 네 일정에 맞추기 딱 좋지!" (딱 일주일만 있을 수도 있고, 아니면 여름 내내 참여할 수도 있어.)

📋 B1 합격 전략 (Section B)
활동적인 학습 강조: "책으로 공부하는 것보다 직접 땅을 파고 유물을 보면서 배우는 게 훨씬 기억에 잘 남을 거야"라고 설득해 보세요.

실행 유도 (Call to action): "Est-ce que tu veux que j'appelle pour nous inscrire ? J'ai le numéro : 06 98 06 35 45." (우리가 등록할 수 있게 내가 전화해 볼까? 번호 여기 있어.)

감정적 연결: "Imagine, on pourrait découvrir un trésor ensemble !" (상상해 봐, 우리가 같이 보물을 발견할 수도 있잖아!)

지금까지 총 12개의 다양한 TEF Canada 말하기 예상 문제들을 살펴보았습니다.

🌟 시험 직전 체크리스트:
Section A (정보 요청): 공손하게(Vouvoyer) 10개 내외의 질문을 던지기.

Section B (설득하기): 친구에게 하듯 친근하게(Tutoyer) 광고 속 정보를 근거로 들어 설득하기.

반박 대응: 면접관이 "비싸다", "바쁘다", "관심 없다"고 할 때 당황하지 말고 "하지만 이런 장점도 있어"라고 되받아치기.
    `,
    13: ``,
    14: `
    마지막 이미지인 "Participez à un 5 à 7 (해피아워 모임 참여)" 광고에 대한 대답입니다. 이 문제는 이웃이나 친구에게 동네 커뮤니티 센터 행사에 함께 가자고 설득하는 Section B 유형입니다. B1 수준에 맞춰 친근하면서도 행사의 즐거운 요소들을 강조하는 흐름으로 구성했습니다.

🗣️ 대화 시작하기 (Introduction)
"Salut ! J’ai vu une affiche super sympa au centre communautaire du quartier. Ils organisent un '5 à 7' le premier vendredi du mois. Comme tu aimes bien rencontrer de nouvelles personnes, j'ai tout de suite pensé à toi. Tu es libre ?" (안녕! 우리 동네 커뮤니티 센터에서 정말 괜찮은 포스터를 봤어. 매달 첫 번째 금요일에 '5 à 7(해피아워)' 모임을 연대. 네가 새로운 사람 만나는 거 좋아하니까 바로 네 생각이 나더라고. 시간 돼?)

💡 설득을 위한 주요 포인트 (Arguments)
1. 사교와 만남의 기회 강조
"C’est l’occasion idéale pour faire connaissance avec les gens de notre quartier." (우리 동네 사람들과 안면을 익힐 수 있는 완벽한 기회야.)

"On peut y aller en famille, donc ce sera une ambiance très chaleureuse et conviviale." (가족 단위로 갈 수 있어서 분위기가 아주 따뜻하고 화기애애할 거야.)

2. 다양한 활동과 즐길 거리
"Il y aura une piste de danse sur place, on pourra s'amuser un peu !" (거기에 댄스 플로어도 있어서 같이 즐겁게 춤도 출 수 있어!)

"Ils organisent aussi des jeux et un tirage au sort. Imagine 만약 우리가 경품에 당첨되면 대박이잖아!" (게임이랑 경품 추첨도 준비되어 있대. 우리가 당첨된다고 생각해 봐!)

3. 실용적인 준비 사항 (부담 없는 참여)
"Chacun apporte de quoi manger, donc on pourra partager un bon repas ensemble." (각자 먹을 걸 가져오는 방식이라 다 같이 맛있는 음식을 나눠 먹을 수 있어.)

"C’est de 17h à 19h, donc ça ne finit 안 늦게 끝나서 다음 날 일정에도 지장 없을 거야." (오후 5시부터 7시까지라 너무 늦지 않게 끝날 거야.)

📋 B1 합격 전략 (Section B)
필수 정보 언급: "Inscription obligatoire (예약 필수)"라는 점을 언급하며 "지금 바로 819 846-7845로 전화해서 예약하자"라고 제안해 보세요.

일정 강조: "매달 첫 번째 금요일(les 1ers vendredis de chaque mois)"이라는 구체적인 일정을 언급하여 지문 이해력을 보여주세요.

자연스러운 마무리: "Allez, viens ! Ça nous fera du bien de sortir un peu et de voir du monde. Je nous inscris ?" (에이, 같이 가자! 좀 나가서 사람들도 보고 하면 기분 전환도 되고 좋잖아. 우리 예약할까?)
    `,
    15: `
    마지막 이미지인 "Les Bâtisseurs du Monde (세계 건축가들)" 광고에 대한 대답입니다. 이 문제는 언어를 배우고 싶어 하거나 의미 있는 일을 찾고 있는 친구에게 **국제 자원활동(chantier international)**을 제안하며 설득하는 Section B 유형입니다. B1 수준에 맞춰 실용적인 혜택을 강조하며 구성했습니다.

🗣️ 대화 시작하기 (Introduction)
"Salut ! Je sais que tu cherches à apprendre une langue tout en faisant quelque chose d'utile. J'ai trouvé une annonce pour un organisme qui s'appelle Les Bâtisseurs du Monde. Ils organisent des chantiers internationaux partout dans le monde. Ça a l'air passionnant, tu veux que je t'explique ?" (안녕! 너 언어도 배우면서 보람찬 일을 하고 싶어 했잖아. 'Les Bâtisseurs du Monde'라는 단체 광고를 봤는데, 전 세계에서 국제 자원활동을 조직한대. 정말 재밌어 보이는데, 내가 좀 더 설명해 줄까?)

💡 설득을 위한 주요 포인트 (Arguments)
1. 전 세계적인 규모와 경험
"Tu peux partir sur les 5 continents ! C'est une chance incroyable de découvrir une nouvelle culture." (무려 5개 대륙으로 떠날 수 있어! 새로운 문화를 발견할 수 있는 엄청난 기회야.)

"C’est un chantier international, donc tu seras avec des gens du monde entier. C'est parfait pour pratiquer les langues !" (국제 활동이라 전 세계 사람들과 함께하게 될 거야. 언어를 연습하기에 딱이지!)

2. 완벽한 지원과 안전
"Ne t'inquiète pas pour l'organisation : le logement, la nourriture et les transports sont assurés par l'organisme." (준비 과정은 걱정 마: 숙소, 식사, 교통편까지 단체에서 다 보장해 준대.)

"Il y a un encadrement professionnel, donc tu seras bien guidé pendant tes missions." (전문적인 인솔팀이 있어서 활동하는 동안 가이드를 잘 받을 수 있을 거야.)

3. 유연한 기간 (부담 없는 참여)
"Tu peux partir pour une durée courte, de 1 à 3 semaines seulement." (딱 1주에서 3주 정도의 짧은 기간만 가도 돼.)

"C'est idéal pour tes vacances, ça te permet de te rendre utile sans y passer tout ton été." (방학 때 가기 딱 좋아. 여름 내내 시간을 쓰지 않고도 보람찬 일을 할 수 있잖아.)

📋 B1 합격 전략 (Section B)
목적에 맞춤형 설득: 친구가 언어 학습에 관심이 있다면 "외국인 동료들과 매일 대화해야 한다"는 점을, 보람에 관심이 있다면 "Actions solidaires(연대 활동)"라는 키워드를 강조하세요.

구체적인 정보 언급: "웹사이트(www.lesbatisseursdumonde.org)에서 너에게 맞는 미션을 찾아볼 수 있어"라고 말하며 대화를 마무리하세요.

적극적인 권유: "C'est beaucoup mieux que de prendre des cours dans une école, tu ne penses pas ?" (학교에서 수업 듣는 것보다 훨씬 낫지 않아?)라며 친구의 동의를 구해보세요.

마무리 연습: 만약 친구가 "너무 힘들 것 같아"라고 거절한다면, 광고에 나온 **"Encadrement professionnel(전문가 인솔)"**을 활용해 어떻게 안심시켜 줄 수 있을까요?
    `,
    16: `
    마지막 이미지인 "Gym Fit 'N' S" 광고에 대한 대답입니다. 이 문제 역시 친구를 설득하여 함께 헬스장에 등록하도록 유도하는 Section B 유형입니다. B1 수준에서 친구가 매력을 느낄 만한 화려한 시설과 특별한 혜택을 중심으로 구성했습니다.

🗣️ 대화 시작하기 (Introduction)
"Salut ! Dis-moi, tu 안녕! 있잖아, 너 요즘 건강 관리하고 싶다고 했지? 내가 방금 신문에서 Gym Fit 'N' S라는 헬스장 광고를 봤는데, 시설이 정말 대박이야. 우리 같이 등록하러 안 갈래?"

💡 설득을 위한 주요 포인트 (Arguments)
1. 다양한 고급 시설 강조
"이곳에는 헬스장뿐만 아니라 요가실, 대형 수영장, 그리고 심지어 유기농 레스토랑까지 있대!"

"운동 끝나고 쉴 수 있는 휴게실(salon de relaxation)이랑 바(bar)도 무료로 이용할 수 있어."

2. 전문가의 맞춤형 프로그램
"가장 놀라운 건, 비욘세와 제이지 같은 스타들의 트레이너들이 직접 맞춤형 프로그램을 짜준다는 거야!"

"우리도 연예인처럼 체계적으로 몸을 만들 수 있는 기회야."

3. 위치와 특별 혜택
"지금 바로 등록하면 'EnForme' 패키지 혜택을 받을 수 있대."

"위치도 파리 Rambuteau역 바로 앞이라 우리 집에서 가기도 엄청 편해."

📋 B1 합격 전략 (Section B)
친구의 흥미 유발: 광고에 나온 유명 연예인(Beyoncé, Jay-Z)의 이름을 언급하며 흥미를 끄는 것이 아주 좋은 전략입니다.

반박에 대한 방어: 친구가 "비쌀 것 같아"라고 하면, "Accès gratuit au bar et au salon"(바와 휴게실 무료 이용) 같은 무료 혜택을 강조하며 가성비가 좋다는 점을 어필하세요.

강력한 마무리: "C'est une occasion unique de s'entraîner comme des stars. On y va demain pour se renseigner ?" (스타들처럼 운동할 수 있는 유일한 기회야. 내일 같이 상담받으러 가볼까?)
    `,
    17: `
    마지막 이미지인 "Voyage en groupe (단체 여행)" 광고에 대한 대답입니다. 이 문제는 친구를 여행에 동행하도록 설득하는 Section B 유형입니다. B1 수준에서 친구에게 제안하기 좋은 논리들로 구성했습니다.

🗣️ 대화 시작하기 (Introduction)
"Salut ! J'ai reçu une publicité super intéressante pour des vacances avec une agence qui s'appelle GroupFun. Comme on a tous les deux besoin de repos, j'ai pensé que ce serait une excellente idée de partir ensemble. Qu'est-ce que tu en penses ?" (안녕! 'GroupFun'이라는 여행사에서 보낸 정말 흥미로운 광고를 받았어. 우리 둘 다 휴식이 필요하니까 같이 떠나면 너무 좋을 것 같아. 어떻게 생각해?)

💡 설득을 위한 주요 포인트 (Arguments)
1. 완벽한 편리함 강조 (스트레스 제로)
"L'annonce dit : pas de réservation, pas de cuisine, pas de souci !" (광고에 예약도, 요리도, 걱정도 필요 없다고 써 있어!)

"L'agence s'occupe de tout pour nous, on n'a rien à organiser." (여행사에서 우리 대신 모든 걸 다 해준대, 우린 준비할 게 하나도 없어.)

2. 다양한 프로그램 (풍성한 볼거리)
"Le programme a l'air génial avec des excursions et des visites de sites touristiques." (프로그램이 아주 좋아 보여. 소풍(엑스커션)도 가고 관광지 방문도 포함되어 있대.)

"C'est l'occasion idéale pour découvrir de nouveaux endroits sans se fatiguer." (지치지 않고 새로운 장소들을 발견할 수 있는 완벽한 기회야.)

3. 유쾌한 분위기와 조건
"La seule condition pour participer, c'est qu'on doit ABSOLUMENT s'amuser !" (참여하기 위한 유일한 조건은 무조건 즐겁게 놀아야 한다는 거야!)

"On va rencontrer beaucoup de monde car ils disent de venir en foule." (사람들이 많이 모이라고 하는 걸 보니 새로운 친구들도 많이 만날 수 있을 거야.)

📋 B1 합격 전략 (Section B)
광고 문구 활용: "Pas de souci (걱정 없음)"나 "Absolument s'amuser (무조건 즐기기)" 같은 광고 속 핵심 문구를 대화에 녹여내면 지문 활용 능력이 높게 평가됩니다.

친구의 거절 대응: 만약 친구가 "계획 짜는 게 귀찮아"라고 하면, "C'est nous qui nous en occuperons"(여행사에서 다 알아서 해준대)라는 광고 문구를 인용해 안심시키세요.

마무리: "Allez, viens avec moi, on va bien rigoler ! Je t'envoie les détails par message ?" (에이, 같이 가자, 진짜 재밌을 거야! 자세한 내용 메시지로 보내줄까?)

연습해볼까요? 만약 친구(면접관)가 "단체 여행은 너무 사람이 많아서 복잡할 것 같아"라고 걱정한다면, 광고의 **"Pas de souci"**라는 점을 들어 어떻게 다시 설득해보고 싶으신가요?
    `,
    18: `
    마지막 문제는 **금연 방법(NICOSTOP)**에 대한 광고를 보고 이웃(혹시 친구)에게 이 방법을 사용해 보라고 설득하는 Section B 유형입니다. 건강, 미용, 경제적 이득을 강조하여 B1 수준으로 구성했습니다.

🗣️ 대화 시작하기 (Introduction)
"Salut ! Je me souviens que tu m'as dit l'autre jour que tu aimerais bien arrêter de fumer. Justement, j'ai trouvé une publicité dans le journal pour une méthode qui a l'air géniale : ça s'appelle NICOSTOP. Ça te dit d'en parler ?" (안녕! 너 저번에 담배 끊고 싶다고 했던 거 기억나. 마침 신문에서 'NICOSTOP'이라는 아주 괜찮아 보이는 금연 방법 광고를 봤어. 이야기 좀 해볼까?)

💡 설득을 위한 주요 포인트 (Arguments)
1. 신체적 변화와 외모 개선 강조
"Avec cette méthode, tu vas redécouvrir les vrais goûts et les odeurs." (이 방법을 쓰면 진짜 맛과 냄새를 다시 느낄 수 있게 될 거야.)

"C'est super pour retrouver une pleine forme et surtout un teint éclatant !" (건강을 회복하는 데 정말 좋고, 특히 안색이 아주 좋아질 거야!)

2. 쉽고 빠른 방법 (두려움 해소)
"Ne t'inquiète pas, c'est une méthode indolore par application de rayons infra-rouges." (걱정 마, 적외선을 이용한 통증이 전혀 없는 방법이래.)

"C'est très rapide : il suffit de faire trois séances pendant trois jours de suite." (방법도 아주 빨라: 3일 연속으로 딱 세 번만 세션을 받으면 돼.)

"Il y a même un suivi pendant 6 mois pour être sûr que tu ne recommences pas, et tout ça sans stress." (다시 피우지 않도록 6개월 동안 사후 관리도 해준대. 게다가 스트레스도 전혀 없다고 해.)

3. 경제적 이득 강조
"Pense à l'économie que tu vas faire en n'achetant plus de cigarettes. C'est énorme !" (담배를 더 이상 사지 않으면서 아끼게 될 돈을 생각해 봐. 엄청날 거야!)

📋 B1 합격 전략 (Section B)
구체적인 정보 제공: 상담센터가 Neuilly sur Seine에 있고 지하철 Sabons역 근처라는 점을 언급하며 가깝다는 것을 강조하세요.

부드러운 압박: "Ne réfléchissez pas longtemps"이라는 문구를 활용해 "너무 오래 고민하지 말고 한번 전화해 봐"라고 권유하세요.

전화번호 안내: "Si tu veux, je te donne le numéro : 01 47 65 47 65. Tu n'as rien à perdre !" (원하면 번호 줄게: 01 47 65 47 65. 밑져야 본전이잖아!)
    `,
    19: `
    이번 문제는 **이동식 급식소(Cantine itinérante)**의 자전거 판매원(Cyclo-vendeur) 구인 광고를 보고 일자리를 찾는 친구를 설득하는 Section B 유형입니다. 건강, 환경, 혜택을 강조하며 B1 수준으로 구성했습니다.

🗣️ 대화 시작하기 (Introduction)
"Salut ! J'ai pensé à toi parce que je sais que tu cherches un travail en ce moment. J'ai vu une offre super pour devenir cyclo-vendeur pour une cantine itinérante. Comme tu adores le vélo, c'est peut-être l'opportunité idéale !" (안녕! 너 요즘 일자리 찾고 있잖아. '이동식 급식소'의 자전거 판매원 구인 광고를 봤는데, 너 자전거 타는 거 좋아하니까 너한테 딱일 것 같아!)

💡 설득을 위한 주요 포인트 (Arguments)
1. 건강과 환경을 동시에 (활동적인 업무)
"C'est un travail très écologique car les repas sont transportés à vélo." (자전거로 식사를 운반하니까 아주 친환경적인 일이야.)

"Tu vas rester en forme tout en travaillant, c'est beaucoup mieux que de rester enfermé dans un bureau !" (일하면서 체력도 관리할 수 있어. 사무실에 갇혀 있는 것보다 훨씬 낫지!)

2. 유연한 근무 조건
"C'est un contrat de 20 heures par semaine, donc tu auras encore du temps libre pour tes loisirs." (주 20시간 계약이라 개인적인 취미 생활을 할 시간도 충분해.)

"Les missions sont simples : il faut transporter les repas et servir les clients." (업무도 간단해. 식사를 운반하고 손님들에게 서빙만 하면 돼.)

3. 매력적인 혜택 (Avantages)
"Ne t'inquiète pas pour l'effort, le vélo électrique est fourni par l'entreprise !" (힘들까 봐 걱정 마, 회사에서 전기 자전거를 제공해 준대!)

"En plus, ton repas t'est offert chaque jour. Ce sont des produits garantis bio et servis chauds." (게다가 매일 식사도 무료로 준대. 유기농 인증 제품에 따뜻하게 제공되는 거래.)

📋 B1 합격 전략 (Section B)
친구의 관심사 연결: "너 평소에 유기농 음식이랑 환경 보호에 관심 많았잖아"라는 식으로 이유를 덧붙이세요.

현실적인 조언: "돈도 벌면서 운동도 할 수 있으니 일석이조야!"라는 점을 강조하세요.

행동 유도: "Intéressé ? On peut aller voir leur site ensemble : www.cantine-itinerante.qc.ca. Tu devrais envoyer ta candidature !" (관심 있어? 같이 웹사이트 들어가 보자. 지원서 한번 넣어봐!)
    `,
    20: `
    이번 문제는 합창단(Chorale) 활동을 통해 영어 실력을 향상시키고 싶은 친구를 설득하는 TEF Section B 유형입니다. 노래를 부르며 즐겁게 공부할 수 있다는 점과 다양한 장르, 연말 공연 등의 혜택을 강조하는 것이 핵심입니다.

🗣️ 대화 시작하기 (Introduction)
"Salut ! Je sais que tu cherches un moyen sympa pour améliorer ton anglais en ce moment. J'ai justement trouvé une publicité pour une chorale internationale qui pourrait t'intéresser. Ça te dirait d'en savoir plus ?" (안녕! 너 요즘 영어 실력 키우려고 재밌는 방법 찾고 있었지? 마침 네가 흥미로워할 만한 '국제 합창단' 광고를 봤어. 좀 더 들어볼래?)

💡 설득을 위한 주요 포인트 (Arguments)
1. 즐거운 학습 방식 강조
"Tu peux travailler ton anglais tout en chantant, c'est beaucoup moins fatigant que des cours classiques !" (노래하면서 영어를 공부할 수 있어, 일반적인 수업보다 훨씬 덜 지루할 거야!)

"L'annonce garantit des progrès rapides et une bonne humeur assurée." (광고에 따르면 실력도 빨리 늘고, 분위기도 아주 좋다고 보장한대.)

2. 다양한 음악 장르 (지루함 해소)
"Le répertoire est vraiment varié : il y a de la pop, du rock, du folk et même du gospel !" (곡 목록이 정말 다양해: 팝, 록, 포크, 그리고 가스펠까지 있대!)

"Il y en a pour tous les goûts, tu trouveras forcément des chansons que tu aimes." (취향대로 고를 수 있어서 네가 좋아하는 노래를 분명 찾을 수 있을 거야.)

3. 목표와 동기 부여
"À la fin de l'année, il y a des spectacles organisés. C'est génial pour gagner en confiance en soi !" (연말에는 공연도 열린대. 자신감을 키우기에 정말 좋겠지!)

"C'est une occasion parfaite pour rencontrer des gens et pratiquer la langue naturellement." (사람들도 만나고 자연스럽게 언어를 연습할 수 있는 완벽한 기회야.)

📋 B1 합격 전략 (Section B)
친구의 상황에 맞춤 제안: "너 노래 부르는 거 좋아하잖아" 혹은 "너 영어 점수 필요하다고 했지?" 같은 개인적인 이유를 덧붙이세요.

거절에 대한 방어: 친구가 "노래를 못해"라고 하면, "중요한 건 실력이 아니라 영어 연습이야"라고 답하고, "바빠"라고 하면 "웹사이트(www.choraleinternationale.org)에서 시간표를 확인해보자"라고 유도하세요.

마무리: "Allez, inscrivons-nous ensemble, ce sera une super aventure !" (에이, 같이 등록하자, 정말 멋진 경험이 될 거야!)
    `,
    21: `
    이번 문제는 와인 시음회 및 해산물 요리 저녁 식사(Dégustation de vin) 광고를 보고 친구를 설득하는 Section B 유형입니다. 셰프의 경력, 메뉴 구성, 저렴한 가격 등을 강조하여 친구가 거절할 수 없게 만드는 것이 포인트입니다.

🗣️ 대화 시작하기 (Introduction)
"Salut ! Dis, tu es libre le dimanche 13 avril au soir ? J'ai vu une annonce super dans le journal pour une soirée de dégustation au restaurant 'Côte d’Azur'. Ça te dirait de m'accompagner ?" (안녕! 있잖아, 4월 13일 일요일 저녁에 시간 돼? 신문에서 'Côte d’Azur' 레스토랑의 시음회 밤 광고를 봤는데 정말 괜찮더라고. 나랑 같이 갈래?)

💡 설득을 위한 주요 포인트 (Arguments)
1. 셰프의 화려한 경력 강조
"Le chef, c’est François Renaud. C'est un ancien chef du Club Med !" (셰프가 프랑수아 르노인데, 무려 클럽메드 출신이래!)

"C'est un restaurant 4 étoiles, donc la qualité est garantie." (4성급 레스토랑이라 퀄리티는 보장되어 있어.)

2. 메뉴와 구성 (해산물 매니아 공략)
"Le menu a l'air délicieux : il y a des huîtres, des moules, des crevettes et même des langoustines !" (메뉴가 대박이야: 굴, 홍합, 새우, 그리고 가시발새우까지 나온대!)

"Ce sont toutes des spécialités françaises de fruits de mer." (전부 프랑스식 해산물 전문 요리들이야.)

3. 가성비와 위치의 편리함
"C’est incroyable, tout ça pour seulement 20 € par personne, et en plus, le café est offert !" (믿기지 않겠지만 이 모든 게 인당 딱 20유로고, 커피도 무료로 준대!)

"Le restaurant est juste face au métro Kitai-Gorod, c'est très facile pour y aller." (식당이 키타이 고로드 지하철역 바로 앞이라 가기도 엄청 편해.)

📋 B1 합격 전략 (Section B)
구체적인 정보 활용: 광고에 나온 **"Dimanche 13 avril à 19 heures"**라는 시간을 정확히 언급하며 약속을 잡으세요.

친구의 예상 반박 대응: 만약 친구가 "비쌀 것 같아"라고 한다면, **"C’est uniquement 20 euros"**라는 점을 들어 설득하세요.

공감대 형성: "Je sais que tu adores les fruits de mer, c'est l'occasion idéale !" (너 해산물 좋아하잖아, 이건 진짜 완벽한 기회야!) 같은 개인적인 멘트를 섞으면 점수가 올라갑니다.

마무리 멘트 예시: "Allez, on y va ! C’est une occasion rare de manger de la grande cuisine pour ce prix-là. On réserve ?" (제발 같이 가자! 이 가격에 이런 고급 요리를 먹을 기회는 흔치 않아. 예약할까?)
    `,
    22: `
    이번 문제는 자원봉사(Bénévolat) 모집 광고를 보고 친구를 설득하는 Section B 유형입니다. 광고의 핵심 키워드인 'S.O.S amitié', '소외된 사람들(personnes isolées)', '유연한 시간(horaires flexibles)' 등을 활용해 B1 수준의 설득 스크립트를 구성해 보았습니다.

🗣️ 대화 시작하기 (Introduction)
"Salut ! Dis-moi, tu m'as dit l'autre jour que tu avais pas mal de temps libre en ce moment, n'est-ce pas ? J'ai vu une annonce pour une association qui s'appelle S.O.S amitié et qui cherche des bénévoles dans notre quartier. J'ai tout de suite pensé à toi !" (안녕! 너 요새 자유 시간 좀 있다고 했었지? 우리 동네에서 봉사자를 찾는 'S.O.S amitié'라는 단체 광고를 봤는데, 바로 네 생각이 나더라고!)

💡 설득을 위한 주요 포인트 (Arguments)
1. 친구의 장점 부각 (적성 강조)
"Tu as le contact facile et tu aimes parler avec les gens. C'est exactement ce qu'ils recherchent pour aider les personnes isolées." (너는 사교성도 좋고 사람들과 대화하는 걸 좋아하잖아. 소외된 분들을 돕기 위해 그들이 딱 찾고 있는 성격이야.)

2. 혜택과 조건 설명 (불안감 해소)
"Ne t'inquiète pas si tu n'as jamais fait ça, une formation est assurée." (이런 일을 해본 적 없어도 걱정 마, 교육을 확실히 해준대.)

"En plus, les horaires sont très flexibles, donc ça ne va pas gâcher tes week-ends." (게다가 시간대도 아주 유연해서 네 주말을 망치지 않을 거야.)

"Il y a même une possibilité de CDD (contrat à durée déterminée) si tu veux travailler plus sérieusement !" (원한다면 기간제 계약(CDD)으로 일할 가능성도 있대!)

3. 가치와 보람 강조 (감정 호소)
"C'est une super occasion pour combattre l'indifférence dans notre société." (우리 사회의 무관심과 싸울 수 있는 정말 좋은 기회야.)

"Tu vas participer à des activités sympas et rencontrer de nouvelles personnes." (재밌는 활동에도 참여하고 새로운 사람들도 만날 수 있어.)

📋 B1 합격 전략 (Section B)
반대 의견에 대비하기: 친구(면접관)가 "경험이 없어서 무서워"라고 하면, 광고에 나온 "Formation assurée"()를 언급하며 안심시켜 주세요.

부드러운 압박: "Tu pourrais au moins essayer une fois, non ?" (적어도 한 번은 시도해 볼 수 있잖아, 그치?) 처럼 친구 사이에 쓸 수 있는 친근한 표현을 써보세요.

연락처 언급: 대화 마지막에 "Tiens, je te donne leur courriel : sosamitie@internet.com. Réfléchis-y !" 라고 마무리하면 지문을 완벽히 활용했다는 인상을 줍니다.

다음 단계로 무엇을 도와드릴까요? 이 상황에 대해 면접관이 할 법한 예상 질문(거절 사유)에 대한 반박 연습을 해볼까요, 아니면 다른 유형의 문제를 더 살펴볼까요?
    `,
    23: `
    이번 문제는 TEF Canada Section B (설득하기) 유형입니다. 이전 문제들과 달리, 정보를 묻는 게 아니라 친구에게 **헌혈(Collecte de sang)**을 제안하고 함께 가자고 설득해야 합니다. B1 수준에 맞춰 논리적이고 다정한 말투로 구성했습니다.

🗣️ 대화 시작하기 (Introduction)
"Salut [친구 이름] ! Tu sais, j'ai lu une annonce intéressante dans le journal ce matin. Il y a une collecte de sang organisée bientôt à la gare de Sarcelles. Ça te dirait d'y aller avec moi ?" (안녕! 오늘 아침 신문에서 흥미로운 광고를 봤어. 곧 Sarcelles 역에서 헌혈 행사가 열린대. 나랑 같이 갈래?)

💡 설득을 위한 주요 포인트 (Arguments)
1. 행사 정보 공유 (내용 요약)
"C'est prévu le mardi 14 février à midi." (2월 14일 화요일 정오에 열린대.)

"C'est très pratique car c'est juste à côté, à la gare." (역 바로 옆이라 가기도 편해.)

2. 헌혈의 중요성 강조 (감정 호소)
"L'annonce dit que la banque du sang est toujours à découvert. Ils ont vraiment besoin de nous." (광고 보니까 혈액 은행이 항상 부족하대. 우리의 도움이 정말 필요해.)

"C’est un geste noble et on peut sauver une vie !" (이건 정말 숭고한 행동이고, 한 생명을 구할 수도 있어!)

"Demain, c’est peut-être nous qui aurons besoin d’aide." (내일은 어쩌면 우리가 도움이 필요한 사람이 될 수도 있잖아.)

3. 친구의 걱정 덜어주기 (회유)
"Ne t'inquiète pas, ça ne prend pas beaucoup de temps." (걱정 마, 시간 별로 안 걸릴 거야.)

"Après, on pourra aller déjeuner ensemble pour reprendre des forces !" (헌혈 끝나고 기운 차리게 같이 점심 먹으러 가자!)

📋 B1 합격 전략 (Section B)
자연스러운 전환: 단순히 정보를 읽는 것이 아니라, "Tu es libre mardi prochain ?" (다음 주 화요일에 시간 돼?) 처럼 대화를 유도하세요.

공감과 설득: 친구가 "바쁘다"거나 "무섭다"고 할 때, "Je comprends, mais..." (이해해, 하지만...)를 사용하여 논리적으로 설득을 이어가는 것이 점수 포인트입니다.

마무리: "Allez, fais un effort, c'est pour la bonne cause !" (에이, 한 번만 같이 가자, 좋은 일이잖아!)라며 강하게 한 번 더 권유해 보세요.

함께 연습해볼까요? 만약 친구(시험관)가 "바늘이 무서워서 못 가겠어"라고 한다면 어떻게 대답하고 싶으신가요? 이 상황에 대한 대답도 제가 도와드릴 수 있습니다.
    `,
    24: `
    1️⃣ 친구에게 일자리 지원 권유

J’ai vu une offre d’emploi qui pourrait t’intéresser, car tu cherches du travail en ce moment.
C’est un emploi accessible et les conditions sont plutôt intéressantes.

D’abord, les horaires sont flexibles, donc tu peux bien organiser ton temps. Par exemple, c’est pratique si tu as d’autres obligations.
Ensuite, le salaire est correct, ce qui permet de gagner de l’argent rapidement.
Enfin, ce travail permet d’avoir une expérience professionnelle utile pour l’avenir.

Même si ce n’est pas un emploi parfait, c’est une bonne opportunité pour commencer.
À ta place, je postulerais.
    `,
    25: `
    2️⃣ 스포츠 이벤트 참가 설득

J’ai vu une annonce pour un événement sportif et je voulais t’en parler.
C’est un événement ouvert à tous, même aux personnes qui ne sont pas très sportives.

Tout d’abord, participer à cet événement est bon pour la santé. Par exemple, faire du sport aide à se sentir mieux physiquement.
Ensuite, c’est une occasion de rencontrer des gens et de partager un bon moment.
Enfin, l’ambiance est conviviale et motivante.

Même si tu as un peu peur de ne pas être à la hauteur, chacun participe à son rythme.
Je pense vraiment que tu devrais essayer.
    `,
    26: `
    3️⃣ 연말 아마존 여행 설득

J’ai trouvé une publicité pour un voyage en Amazonie, et je pense que c’est une très bonne idée pour les fêtes de fin d’année.
C’est un voyage original et différent des vacances habituelles.

D’abord, on peut découvrir une nature incroyable, avec des paysages uniques.
Ensuite, c’est une expérience culturelle enrichissante, car on rencontre les populations locales.
Enfin, ce voyage permet de changer complètement de rythme et de se déconnecter.

C’est vrai que le voyage est long, mais tout est bien organisé.
À mon avis, c’est une occasion unique à ne pas manquer.
    `,
    27: `
    4️⃣ 봉사활동 참여 설득

J’ai vu une annonce pour faire du bénévolat et j’ai pensé à toi.
C’est une activité humaine et utile.

D’abord, le bénévolat permet d’aider des personnes qui en ont besoin. Par exemple, on peut apporter du soutien moral.
Ensuite, c’est une expérience enrichissante sur le plan personnel.
Enfin, cela peut aussi être valorisant pour le CV.

Même si ce n’est pas payé, on gagne beaucoup sur le plan humain.
Je pense que tu serais très bien dans ce rôle.
    `,
    28: `
    5️⃣ 주거 공유 프로그램 설득

J’ai lu une annonce pour un programme de partage de logement, et je voulais t’en parler.
C’est une solution intéressante pour trouver un logement plus facilement.

D’abord, le loyer est souvent moins cher, ce qui permet de faire des économies.
Ensuite, on n’est pas seul, donc c’est plus rassurant.
Enfin, cela permet de créer des liens sociaux.

Bien sûr, il faut s’adapter à l’autre personne, mais en général l’expérience est positive.
Je te conseille de t’inscrire à ce programme.
    `,
    29: `
    6️⃣ 카풀(동승) 이용 설득

J’ai vu une annonce pour le covoiturage et je pense que c’est une bonne solution de transport.
C’est pratique et économique.

D’abord, on partage les frais, donc on dépense moins d’argent.
Ensuite, le covoiturage est meilleur pour l’environnement, car il y a moins de pollution.
Enfin, c’est souvent plus agréable de voyager avec d’autres personnes.

Même si cela demande un peu d’organisation, les avantages sont nombreux.
À mon avis, tu devrais essayer le covoiturage.
    `,
    30: `
    7️⃣ 아이들 대상 무료 요리 수업 봉사 설득

J’ai vu une annonce pour donner gratuitement des cours de cuisine à des enfants.
Comme tu aimes cuisiner, cette activité est faite pour toi.

D’abord, tu peux partager ta passion avec les enfants.
Ensuite, les enfants apprennent des choses utiles tout en s’amusant.
Enfin, c’est une expérience très gratifiante sur le plan personnel.

Même si ce n’est pas rémunéré, c’est une activité très enrichissante.
Je suis sûr(e) que tu ferais un excellent travail.
    `,
  },
};

const TEFCanada: React.FC<TEFCanadaProps> = ({ onBack }) => {
  const [currentSection, setCurrentSection] = useState<'sectionA' | 'sectionB'>('sectionA');
  const [currentQuestion, setCurrentQuestion] = useState<number>(0); // 0이면 Section 이미지, 1 이상이면 문제 이미지
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [showSampleAnswer, setShowSampleAnswer] = useState<boolean>(false);
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [geminiAnalysis, setGeminiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [textInputRef, setTextInputRef] = useState<HTMLTextAreaElement | null>(null);

  const handleRecordingComplete = (transcript: string) => {
    setUserAnswer(transcript);
    setCurrentTranscript('');
    setIsRecording(false);
  };

  const calculateSimilarity = async () => {
    if (!userAnswer.trim()) return;
    if (currentQuestion === 0) return; // 문제가 선택되지 않았으면 리턴
    
    setIsAnalyzing(true);
    setGeminiAnalysis(null);
    setShowResult(true);
    
    // 현재 문제의 모범 답안 가져오기
    const sampleAnswer = sampleAnswers[currentSection]?.[currentQuestion] || '';
    
    if (!sampleAnswer || sampleAnswer.includes('작성되지 않았습니다') || sampleAnswer.includes('작성하세요')) {
      setIsAnalyzing(false);
      setSimilarityScore(0);
      return;
    }
    
    try {
      // Gemini API 호출 (환경에 따라 자동 선택)
      const lambdaUrl = process.env.REACT_APP_LAMBDA_FUNCTION_URL;
      const data = await analyzeWithGemini(
        {
          userAnswer,
          sampleAnswer,
          question: `${currentSection === 'sectionA' ? 'Section A' : 'Section B'} - Question ${currentQuestion}`,
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
          // 점수가 없으면 기본값 설정
          setSimilarityScore(0);
        }
      } else {
        console.error('Gemini API 오류:', data.error);
        setSimilarityScore(0);
      }
    } catch (error) {
      console.error('유사도 계산 오류:', error);
      setSimilarityScore(0);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetState = () => {
    setUserAnswer('');
    setCurrentTranscript('');
    setShowResult(false);
    setShowSampleAnswer(false);
    setSimilarityScore(null);
    setGeminiAnalysis(null);
    setIsAnalyzing(false);
  };

  const getQuestionImagePath = () => {
    return `/${currentSection === 'sectionA' ? 'Section A' : 'Section B'} - Question ${currentQuestion}.png`;
  };

  const getAvailableQuestions = () => {
    if (currentSection === 'sectionA') {
      // Section A: Question 1-11
      return Array.from({ length: 11 }, (_, i) => i + 1);
    } else {
      // Section B: Question 1-30
      return Array.from({ length: 30 }, (_, i) => i + 1);
    }
  };

  // 프랑스어 악센트 문자 삽입
  const insertAccent = (accent: string) => {
    if (textInputRef) {
      const start = textInputRef.selectionStart;
      const end = textInputRef.selectionEnd;
      const text = userAnswer;
      const newText = text.substring(0, start) + accent + text.substring(end);
      setUserAnswer(newText);
      
      // 커서 위치 조정
      setTimeout(() => {
        if (textInputRef) {
          textInputRef.focus();
          textInputRef.setSelectionRange(start + accent.length, start + accent.length);
        }
      }, 0);
    } else {
      // textarea가 없으면 그냥 추가
      setUserAnswer(userAnswer + accent);
    }
  };

  // 프랑스어 악센트 키보드 버튼들
  const frenchAccents = [
    { label: 'é', char: 'é', title: 'e with accent aigu' },
    { label: 'è', char: 'è', title: 'e with accent grave' },
    { label: 'ê', char: 'ê', title: 'e with circumflex' },
    { label: 'ë', char: 'ë', title: 'e with diaeresis' },
    { label: 'à', char: 'à', title: 'a with accent grave' },
    { label: 'â', char: 'â', title: 'a with circumflex' },
    { label: 'ç', char: 'ç', title: 'c with cedilla' },
    { label: 'ô', char: 'ô', title: 'o with circumflex' },
    { label: 'ù', char: 'ù', title: 'u with accent grave' },
    { label: 'û', char: 'û', title: 'u with circumflex' },
    { label: 'ï', char: 'ï', title: 'i with diaeresis' },
    { label: 'î', char: 'î', title: 'i with circumflex' },
    { label: 'É', char: 'É', title: 'E with accent aigu' },
    { label: 'È', char: 'È', title: 'E with accent grave' },
    { label: 'Ê', char: 'Ê', title: 'E with circumflex' },
    { label: 'À', char: 'À', title: 'A with accent grave' },
    { label: 'Ç', char: 'Ç', title: 'C with cedilla' },
  ];

  return (
    <div className="tef-canada">
      <header className="tef-header">
        <button onClick={onBack} className="back-button">
          ← 뒤로 가기
        </button>
        <h1>🇫🇷 TEF Canada</h1>
      </header>
      
      <main className="tef-main">
        {/* Subjonctif List 이미지 */}
        <div className="subjonctif-display">
          <div className="subjonctif-image-container">
            <img 
              src="/Subjonctif List.png"
              alt="Subjonctif List"
              className="subjonctif-image"
            />
          </div>
        </div>

        {/* Evaluation 이미지 */}
        <div className="evaluation-display">
          <div className="evaluation-image-container">
            <img 
              src="/evaluation.png"
              alt="Evaluation"
              className="evaluation-image"
            />
          </div>
        </div>

        <div className="section-selector">
          <button 
            onClick={() => {
              setCurrentSection('sectionA');
              setCurrentQuestion(0); // Section 이미지 표시
              resetState();
            }} 
            className={`section-button ${currentSection === 'sectionA' ? 'active' : ''}`}
          >
            Section A
          </button>
          <button 
            onClick={() => {
              setCurrentSection('sectionB');
              setCurrentQuestion(0); // Section 이미지 표시
              resetState();
            }} 
            className={`section-button ${currentSection === 'sectionB' ? 'active' : ''}`}
          >
            Section B
          </button>
        </div>

        {/* 문제 선택 버튼 */}
        <div className="question-selector">
          <h4>문제 선택:</h4>
          <div className="question-buttons">
            {getAvailableQuestions().map((questionNum) => (
              <button
                key={questionNum}
                onClick={() => {
                  setCurrentQuestion(questionNum);
                  resetState();
                }}
                className={`question-button ${currentQuestion === questionNum ? 'active' : ''}`}
              >
                Question {questionNum}
              </button>
            ))}
          </div>
        </div>

        {/* Section 이미지 또는 문제 이미지 표시 */}
        <div className="question-display">
          <div className="question-image-container">
            {currentQuestion === 0 ? (
              // 문제가 선택되지 않았을 때 Section 이미지 표시
              <img 
                src={`/${currentSection === 'sectionA' ? 'Section A' : 'Section B'}.png`}
                alt={`${currentSection === 'sectionA' ? 'Section A' : 'Section B'}`}
                className="question-image"
              />
            ) : (
              // 문제가 선택되었을 때 문제 이미지 표시
              <img 
                src={getQuestionImagePath()}
                alt={`${currentSection === 'sectionA' ? 'Section A' : 'Section B'} Question ${currentQuestion}`}
                className="question-image"
              />
            )}
          </div>
          
          {/* 모범 답안 보기 버튼 (문제가 선택되었을 때만 표시) */}
          {currentQuestion > 0 && (
            <div className="sample-answer-section" style={{ marginTop: '20px', textAlign: 'center' }}>
              <button 
                onClick={() => setShowSampleAnswer(!showSampleAnswer)}
                className="show-answer-button"
                style={{
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(40, 167, 69, 0.3)',
                  marginBottom: '15px'
                }}
              >
                {showSampleAnswer ? '📖 Réponse modèle (Masquer)' : '📖 Réponse modèle (Afficher)'}
              </button>
              {showSampleAnswer && (
                <div className="sample-answer-content" style={{
                  background: '#f8f9fa',
                  padding: '20px',
                  borderRadius: '10px',
                  marginTop: '15px',
                  borderLeft: '4px solid #28a745',
                  textAlign: 'left',
                  whiteSpace: 'pre-line'
                }}>
                  <p style={{ margin: 0, lineHeight: '1.7', color: '#333', fontSize: '1rem' }}>
                    {sampleAnswers[currentSection]?.[currentQuestion] || "모범 답안이 아직 작성되지 않았습니다."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <SpeechRecognition
          isRecording={isRecording}
          onStartRecording={() => {
            setIsRecording(true);
            setCurrentTranscript('');
          }}
          onStopRecording={() => setIsRecording(false)}
          onRecordingComplete={handleRecordingComplete}
          onTranscriptUpdate={setCurrentTranscript}
          language="fr-CA"
        />

        {isRecording && (
          <div className="user-answer">
            <h3>🎤 Reconnaissance vocale en temps réel:</h3>
            <p style={{ fontStyle: 'italic', color: '#666' }}>
              {currentTranscript || 'Reconnaissance de la voix en cours...'}
            </p>
          </div>
        )}

        {/* 답변 입력 및 수정 영역 */}
        {currentQuestion > 0 && (
          <div className="answer-input-section" style={{
            background: 'white',
            borderRadius: '15px',
            padding: '25px',
            marginTop: '20px',
            boxShadow: '0 5px 20px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>
              ✍️ Votre réponse (답변 입력/수정):
            </h3>
            
            {/* 텍스트 입력 필드 */}
            <textarea
              ref={(el) => setTextInputRef(el)}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="음성 인식 결과가 여기에 표시되거나 직접 입력하세요..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '15px',
                border: '2px solid #e0e0e0',
                borderRadius: '10px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                marginBottom: '15px'
              }}
            />

            {/* 프랑스어 악센트 키보드 */}
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#666' }}>
                🇫🇷 프랑스어 악센트:
              </h4>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                {frenchAccents.map((accent, index) => (
                  <button
                    key={index}
                    onClick={() => insertAccent(accent.char)}
                    title={accent.title}
                    style={{
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: 600,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 5px rgba(102, 126, 234, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 5px rgba(102, 126, 234, 0.3)';
                    }}
                  >
                    {accent.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 분석 버튼 */}
            {userAnswer.trim() && (
              <button 
                onClick={calculateSimilarity} 
                className="compare-button"
                disabled={isAnalyzing || currentQuestion === 0}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  background: isAnalyzing || currentQuestion === 0 
                    ? '#ccc' 
                    : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: isAnalyzing || currentQuestion === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  boxShadow: isAnalyzing || currentQuestion === 0 
                    ? 'none' 
                    : '0 4px 15px rgba(40, 167, 69, 0.3)'
                }}
              >
                {isAnalyzing ? '🤖 AI 분석 중...' : '📊 Analyser la similarité'}
            </button>
            )}
          </div>
        )}

        {showResult && similarityScore !== null && currentQuestion > 0 && (
          <ResultDisplay
            similarityScore={similarityScore}
            userAnswer={userAnswer}
            sampleAnswer={sampleAnswers[currentSection]?.[currentQuestion] || ''}
            geminiAnalysis={geminiAnalysis}
            isAnalyzing={isAnalyzing}
          />
        )}
      </main>
    </div>
  );
};

export default TEFCanada;
