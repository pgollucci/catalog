import React from 'react';
// import styles from './mystyle.module.css';
const styles = require('./mystyle.module.css');


const App: React.FC = () => {
  return (
    <div className={'styles.header'}>
      {/* <header className="App-header">
      </header> */}
      <body className={'styles.body'}>
        <div className={'styles.wrapper-box'}>
          <div className={'styles.main-wrapper'}>
            <div className={'styles.header'}>
              <div className={styles.langauge}> <span>Language<b></b></span>
                <ul className={'styles.langauge-ul'}>
                  <li className={'styles.langauge-ul-li'}><a title="English"><img src="image/flags/us.png" alt="English" />English</a></li>
                  <li className={'styles.langauge-ul-li'}><a title="Türkçe"><img src="image/flags/tr.png" alt="Türkçe" />Türkçe</a></li>
                </ul>
              </div>
              <div className="links"> <a href="login.html">Login</a> <a href="register.html">Register</a> <a href="#">My Account</a> </div>
            </div>
          </div>
        </div>
      </body>
    </div>
  );
}

export default App;
