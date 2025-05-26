# 프로파일러 테스트 시각화 프로젝트

프로파일러 테스트 결과 파일을 업로드하면 CPU core 및 task별 throughput 통계를 그래프로 시각화해주는 웹 애플리케이션입니다.

---

## 1. 초기 세팅 방법

프로젝트를 클론하거나 다운로드한 후, 아래 명령어로 필요한 모듈을 설치하세요.

```
npm install

```

## 2. 데이터베이스 세팅

본 프로젝트는 MySQL을 사용합니다.

`db.js` 파일에서 MySQL 사용자 이름과 비밀번호를 본인 환경에 맞게 수정해주세요.

 local mysql에 `profiler_db` 라는 데이터베이스가 생성되어 있어야 합니다. 

```js
const pool = mysql.createPool({
  host: 'localhost',
  user: 'your_username',     // MySQL 사용자명으로 변경
  password: 'your_password', // 비밀번호로 변경
  database: 'your_database', // 사용할 데이터베이스명으로 변경
});
```
필요 시, MySQL에 데이터베이스와 테이블을 미리 생성해주세요.


## 3. 서버 실행 방법
아래 명령어로 서버를 실행합니다.
```
node app.js
```
서버는 기본적으로 http://localhost:3000 에서 실행됩니다.

## 4. 사용법
웹페이지에서 프로파일러 테스트 결과 파일을 업로드합니다.

예시 이미지는 example/inputFile.txt 에 있습니다.

업로드된 데이터가 데이터베이스에 저장되고, core별 및 task별 throughput 통계가 그래프로 표시됩니다.

필요한 기능 추가나 문의사항은 언제든지 환영합니다.
