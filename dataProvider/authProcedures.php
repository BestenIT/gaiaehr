<?php
/**
 * Created by JetBrains PhpStorm.
 * User: Ernesto J. Rodriguez (Certun)
 * File: authProcedures.php
 * Date: 1/13/12
 * Time: 8:41 AM
 */
if(!isset($_SESSION)){
    session_name ('GaiaEHR');
    session_start();
    session_cache_limiter('private');
}
include_once($_SESSION['site']['root'].'/classes/dbHelper.php');
include_once($_SESSION['site']['root'].'/classes/AES.php');
include_once($_SESSION['site']['root'].'/classes/Sessions.php');
include_once($_SESSION['site']['root'] .'/dataProvider/Patient.php');

class authProcedures {

	private $session;

	function __construct(){
		$this->session = new Sessions();
	}

    /**
     * @param stdClass $params
     * @return int
     */
    public function login(stdClass $params){

        //-------------------------------------------
        // Check that the username do not pass
        // the maximum limit of the field.
        //
        // NOTE:
        // If this condition is met, the user did not
        // use the logon form. Possible hack.
        //-------------------------------------------
        if (strlen($params->authUser) >= 26){
         	return array('success'=>false, 'error'=>'Possible hack, please use the Logon Screen.');
        }
        //-------------------------------------------
        // Check that the username do not pass
        // the maximum limit of the field.
        //
        // NOTE:
        // If this condition is met, the user did not
        // use the logon form. Possible hack.
        //-------------------------------------------
        if (strlen($params->authPass) >= 11){
            return array('success'=>false, 'error'=>'Possible hack, please use the Logon Screen.');
        }
        //-------------------------------------------
        // Simple check username
        //-------------------------------------------
        if (!$params->authUser){
            return array('success'=>false, 'error'=>'The username field can not be in blank. Try again.');
        }
        //-------------------------------------------
        // Simple check password
        //-------------------------------------------
        if (!$params->authPass){
            return array('success'=>false, 'error'=>'The password field can not be in blank. Try again.');
        }
        //-------------------------------------------
        // Find the AES key in the selected site
        // And include the rest of the remaining
        // variables to connect to the database.
        //-------------------------------------------

        $fileConf = '../sites/' . $params->site . '/conf.php';
        if (file_exists($fileConf)){
            /** @noinspection PhpIncludeInspection */
            include_once($fileConf);
            $db = new dbHelper();
        	$err = $db->getError();
        	if (!is_array($err)){
                return array('success'=>false, 'error'=>'For some reason, I can\'t connect to the database.');
        	}
        	// Do not stop here!, continue with the rest of the code.
        } else {
            return array('success'=>false, 'error'=>'No configuration file found for site <span style="font-weight:bold">'.$params->site.'</span>.<br>Please double check URL or contact support desk.');
        }
        //-------------------------------------------
		// remove empty space from username and password
        //-------------------------------------------
	    $params->authUser = str_replace(' ', '', $params->authUser);
	    $params->authPass = str_replace(' ', '', $params->authPass);
        //-------------------------------------------
        // Convert the password to AES and validate
        //-------------------------------------------
        $aes = new AES($_SESSION['site']['AESkey']);
        //-------------------------------------------
        // Username & password match
        //-------------------------------------------
        $db->setSQL("SELECT id, username, title, fname, mname, lname, email, password
                         FROM users
        		        WHERE username   = '$params->authUser'
        		          AND authorized = '1'
        		        LIMIT 1");

        $user = $db->fetchRecord();
        if ($params->authPass != $aes->decrypt($user['password'])){
            return array('success'=>false, 'error'=>'The username or password you provided is invalid.');
        } else {
			//------------------------------------------
	        // set site where user is authorized to access;
			//------------------------------------------
	        $_SESSION['site']['site'] = $params->site;
        	//-------------------------------------------
        	// Change some User related variables and go
        	//-------------------------------------------
        	$_SESSION['user']['name']   = $user['title'] . " " . $user['lname'] . ", " . $user['fname'] . " " . $user['mname'];
        	$_SESSION['user']['id']     = $user['id'];
        	$_SESSION['user']['email']  = $user['email'];
        	$_SESSION['user']['site']   = $params->site;
        	$_SESSION['user']['auth']   = true;
        	//-------------------------------------------
        	// Also fetch the current version of the
        	// Application & Database
        	//-------------------------------------------
        	$sql = "SELECT * FROM version LIMIT 1";
            $db->setSQL($sql);
        	$version = $db->fetchRecord();
        	$_SESSION['ver']['codeName']    = $version['v_tag'];
        	$_SESSION['ver']['major']       = $version['v_major'];
        	$_SESSION['ver']['rev']         = $version['v_patch'];
        	$_SESSION['ver']['minor']       = $version['v_minor'];
        	$_SESSION['ver']['database']    = $version['v_database'];
            $_SESSION['lang']['code']       = $params->lang;
            $_SESSION['site']['checkInMode']  = $params->checkInMode;
	        $_SESSION['timeout'] = time();
	        $session = new Sessions();
	        $session->loginSession();
	        $_SESSION['inactive']['timeout'] = time();
            return array('success'=>true);
        }
    }

    /**
     * @static
     * @return mixed
     */
    public function unAuth(){
	    $s = new Sessions();
	    $p = new Patient();
	    $s->logoutSession();
        $p->patientChartInByPid($_SESSION['patient']['pid']);
        session_unset();
        session_destroy();
        return;
    }

    /**
     * @static
     * @return int
     */
    public function ckAuth(){
        $_SESSION['site']['flops']++;
        //****************************************************************
        // If the session has passed 60 flops, with out any activity exit
        // the application.
        //
        // return an exit code
        //****************************************************************
        if($_SESSION['site']['flops'] < 300) {
	        $session = new Sessions();
	   	    $session->updateSession();
            return array('authorized' => true);
        }else{
	        $this->unAuth();
            return array('authorized' => false);
        }
    }

    public function getSites(){
        $rows = array();
        foreach($_SESSION['site']['sites'] as $row){
            $site['site_id'] = $row;
            $site['site']    = $row;
            array_push($rows,$site);
        }
        return $rows;
    }
}
