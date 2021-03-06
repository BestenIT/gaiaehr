<?php
if(!isset($_SESSION)){
    session_name ( 'GaiaEHR' );
    session_start();
    session_cache_limiter('private');
}
include_once($_SESSION['site']['root'].'/classes/dbHelper.php');
/**
 * Access Control List (ACL).
 *
 * This class will handle all the permissions
 * @author Ernesto J. Rodriguez (certun) <erodriguez@certun.com>
 * @version 1.0
 *
 * @package default
 */
class ACL {

    /**
     * @var array
     */
    private $perms = array();
    /**
     * @var int
     */
    private $user_id;
    /**
     * @var array
     */
    private $user_roles = array();
    /**
     * @var dbHelper
     */
    protected $conn;

    /**
     * @internal param string $user_id
     * @param null $user_id
     */
	public function __construct($user_id = null){
        $this->conn = new dbHelper();
        $this->user_id = ($user_id == null)? $_SESSION['user']['id'] : $user_id;
        $this->user_roles = $this->getUserRoles();
        $this->buildACL();

	}

    /**
     * @internal param string $format
     * @return array
     */
    public function getAllRoles(){
        $roles = array();
        $this->conn->setSQL("SELECT * FROM acl_roles ORDER BY seq ASC");
        foreach ($this->conn->fetchRecords(PDO::FETCH_ASSOC) as $row) {
            array_push($roles, $row);
        }
        $total = $this->conn->rowCount();
        return array('totals'=>$total,'row'=>$roles);
    }

    /**
     * @param string $format
     * @return array
     */
    public function getAllPermissions($format='ids'){
        $format = strtolower($format);
        $strSQL = "SELECT * FROM acl_permissions ORDER BY seq ASC";
        $this->conn->setSQL($strSQL);

        $resp = array();
        foreach($this->conn->fetchRecords(PDO::FETCH_ASSOC) as $row){
            if ($format == 'full'){
                $resp[$row['perm_key']] = array('id' => $row['id'], 'Name' => $row['perm_name'], 'Key' => $row['perm_key'], 'Cat' => $row['perm_cat']);
            } else {
                $resp[] = $row['id'];
            }
        }
        return $resp;
    }

    /**
     * @return array
     */
	private function getUserRoles(){
		$roles = array();
        $this->conn->setSQL("SELECT ar.role_key
                               FROM acl_user_roles AS aur
                          LEFT JOIN acl_roles AS ar ON aur.role_id = ar.id
                              WHERE aur.user_id = '$this->user_id'");
		foreach($this->conn->fetchRecords(PDO::FETCH_ASSOC) AS $role){
			$roles[] = $role['role_key'];
		}
		return $roles;
	}

    // This function can be named buildAccessControlList();
	private function buildACL(){
		//first, get the rules for the user's role
		if (count($this->user_roles) > 0){
			$this->perms = array_merge($this->perms,$this->getRolePerms($this->user_roles));
		}
		//then, get the individual user permissions
		$this->perms = array_merge($this->perms,$this->getUserPerms());
	}

    /**
     * @param $perm_id
     * @return mixed
     */
	private function getPermNameByPermKey($perm_Key){
		$strSQL = "SELECT perm_name FROM acl_permissions WHERE perm_key = '$perm_Key' LIMIT 1";
        $this->conn->setSQL($strSQL);
		$row = $this->conn->fetchRecord(PDO::FETCH_ASSOC);
		return $row['perm_name'];
	}

    /**
     * @param $role_id
     * @return mixed
     */
	private function getRoleNameByRoleKey($role_key){
        $this->conn->setSQL("SELECT role_name FROM acl_roles WHERE role_key = '$role_key' LIMIT 1");
		$row = $this->conn->fetchRecord(PDO::FETCH_ASSOC);
		return $row['role_name'];
	}

	/**
	 * @internal param $role
	 * @return array
	 */
	private function getRolePerms(){

		if (is_array($this->user_roles)){

			$fo = implode("','",$this->user_roles);
			$roleSQL = "SELECT * FROM acl_role_perms WHERE role_key IN ('$fo') ORDER BY id ASC";
		} else {
			$fo = $this->user_roles;
			$roleSQL = "SELECT * FROM acl_role_perms WHERE role_key = '$fo' ORDER BY id ASC";
		}
        $this->conn->setSQL($roleSQL);
		$perms = array();
		foreach($this->conn->fetchRecords(PDO::FETCH_ASSOC) as $row){
			$pK = $pK = strtolower($row['perm_key']);
			if ($pK == '') { continue; }
            if ($row['value'] == '1') {
                $hP = true;
            } else {
                $hP = false;
            }
			$perms[$pK] = array('perm' => $pK,'inheritted' => true,'value' => $hP,'Name' => $this->getPermNameByPermKey($row['perm_key']), 'id' => $row['id']);
		}
		return $perms;
	}

	/**
	 * @internal param $user_id
	 * @return array
	 */
	public function getUserPerms(){
        $this->conn->setSQL("SELECT * FROM acl_user_perms WHERE user_id = '$this->user_id' ORDER BY add_date ASC");
		$perms = array();
        foreach($this->conn->fetchRecords(PDO::FETCH_ASSOC) as $row){
			$pK = strtolower($row['perm_key']);
			if ($pK == '') { continue; }
            if ($row['value'] == '1') {
                $hP = true;
            } else {
                $hP = false;
            }
			$perms[$pK] = array('perm' => $pK,'inheritted' => false,'value' => $hP,'Name' => $this->getPermNameByPermKey($row['perm_key']), 'id' => $row['id']);
		}
	return $perms;
	}

    /**
     * @param $role_id
     * @return bool
     */
	private function userHasRole($role_id){
		foreach($this->user_roles as $k => $v){
			if (floatval($v) === floatval($role_id)){ return true; }
		}
		return false;
	}

	public function getAllUserPermsAccess(){
		return array_values($this->perms);
	}

    /**
     * Has Permission.
     *
     * This public function will return true if the user
     * has permission to to the permission passed as
     * an argument
     *
     *
     * @param $perm_key
     * @return bool
     *
     * {@source }
     */
	public function hasPermission($perm_key){
		$perm_key = strtolower($perm_key);
		if (array_key_exists($perm_key,$this->perms)){
            if ($this->perms[$perm_key]['value'] === '1' || $this->perms[$perm_key]['value'] === true){
                return true;
            } else {
                return false;
            }
        } else {
            return false;
		}
	}
}
//print '<pre>';
//$acl = new ACL();
//print_r($acl->getAllUserPermsAccess());