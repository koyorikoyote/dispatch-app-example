"use client";

import { useState, useCallback } from "react";
import { View } from "react-native";
import { UserSearch } from "./UserSearch";
import { EmployeeDetails } from "./EmployeeDetails";
import { User } from "../types/api";

export function EmployeeBrowser() {
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  
  // Preserve search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"user" | "supervisor">("user");
  const [users, setUsers] = useState<User[]>([]);

  const handleSearchStateChange = useCallback((query: string, type: "user" | "supervisor", userList: User[]) => {
    setSearchQuery(query);
    setSearchType(type);
    setUsers(userList);
  }, []);

  if (selectedEmployee) {
    return (
      <EmployeeDetails
        user={selectedEmployee}
        onBack={() => setSelectedEmployee(null)}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <UserSearch 
        onSelectUser={setSelectedEmployee}
        initialSearchQuery={searchQuery}
        initialSearchType={searchType}
        initialUsers={users}
        onSearchStateChange={handleSearchStateChange}
      />
    </View>
  );
}